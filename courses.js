(function ($) {
    $.fn.waitUntilExists = function (handler, shouldRunHandlerOnce, isChild) {
        var found = 'found',
            $this = $(this.selector),
            $elements = $this.not(function () { return $(this).data(found); }).each(handler).data(found, true);
    
        if (!isChild) {
            (window.waitUntilExists_Intervals = window.waitUntilExists_Intervals || {})[this.selector] = window.setInterval(function () { $this.waitUntilExists(handler, shouldRunHandlerOnce, true); }, 500);
        }
        else if (shouldRunHandlerOnce && $elements.length) {
            window.clearInterval(window.waitUntilExists_Intervals[this.selector]);
        }

        return $this;
    }
}(jQuery));


(function($){
    var prettifyNumber = function(n) {
        var ending = 'th';
        if (n === 1) {
            ending = 'st';
        } else if (n === 2) {
            ending = 'nd';
        } else if (n === 3) {
            ending = 'rd';
        }
        
        return n + ending;
    }

    var parseSemesters = function() {
        // Data holder for all the semesters
        var semesters = [],
            plannerDivs = $('.plannerContentDiv');

        plannerDivs.each(function(i) {
            var title = $('.semesterHeader', plannerDivs[i]).first().text(),
                semester = $('.periodTable', plannerDivs[i]).first(),
                currentSemester = false,
                courses = parseCourses(semester);
            // If there are more than one course table in the semester (typically with
            // the 3-week courses), then we add that to the 13-week courses.
            if ($('.periodTable', plannerDivs[i]).length > 2) {
                courses = courses.concat(
                    parseCourses($('.periodTable', plannerDivs[i]).first().next().next())
                );
            }
            // The current semester has the title in a different element/class.
            if (title == '') {
                title = $('.presentSemesterHeader', plannerDivs[i]).first().text().slice(0,11);
                currentSemester = true;
            }
            // Finally, put the data in our container.
            semesters.push({
                title: title,
                current: currentSemester,
                number: i+1,
                prettyNumber: prettifyNumber(i+1),
                courses: courses
            });
        });

        return semesters;
    }

    var parseCourses = function(semester) {
        // The first tr in the table is the table header, so we
        // ignore that.
        var courses = $('tr', semester).slice(1);
        var courseCollection = [];
        courses.each(function(i) {
            var courseStatus = $('.CourseStatus', courses[i]).text(),
                passed = undefined,
                ongoing = undefined,
                upcoming = undefined;
                planned = undefined;
            if (courseStatus === 'passed' || courseStatus === 'bestået') {
                passed = true;
            } else if (courseStatus === 'not passed' || courseStatus === 'ikke bestået') {
                passed = false;
            } else if (courseStatus === 'tilmeldt godkendt') {
                ongoing = true;
            } else if (courseStatus === 'plads godkendt') {
                upcoming = true
            } else if (courseStatus === 'planned' || courseStatus === 'planlagt') {
                planned = true;
            }
            // Put the data in our array for courses from that semester
            courseCollection.push({
                number: $('.coursecode', courses[i]).text().split(" ").slice(0,1)[0],
                ECTS: $('.ects', courses[i]).text().split(" ").slice(0,1)[0],
                passed: passed,
                ongoing: ongoing,
                upcoming: upcoming,
                planned: planned
            });
        });

        return courseCollection;
    }

    var countECTSPoints = function(semester, check) {
        var points = 0.0;
        for(i in semester.courses) {
            var course = semester.courses[i];
            if (check(course)) {
                points += parseFloat(course.ECTS.replace(',', '.'));
            }
        }
        return points;
    }

    var getPoints = function(semesters, techCourses, natureCourses, projectCourses) {
        var points = {
            passed: 0,
            ongoing: 0,
            upcoming: 0,
            tech: 0,
            free: 0,
            nature: 0,
            project: 0,
            ongoingTech: 0,
            ongoingFree: 0,
            ongoingNature: 0,
            ongoingProject: 0,
        }
        for (i in semesters) {
            var s = semesters[i];
            // Accumulate all the points from the semesters
            points.passed += countECTSPoints(s, function(c) { return c.passed; });
            points.ongoing += countECTSPoints(s, function(c) { return c.ongoing; });
            points.upcoming += countECTSPoints(s, function(c) { return c.upcoming; });
            points.tech += countECTSPoints(s, function(c) { return c.passed && techCourses.indexOf(c.number) > -1; });
            points.nature += countECTSPoints(s, function(c) { return c.passed && natureCourses.indexOf(c.number) > -1; ; });
            points.project += countECTSPoints(s, function(c) { return c.passed && projectCourses.indexOf(c.number) > -1; ; });
            points.free += countECTSPoints(s, function(c) { return c.passed && techCourses.indexOf(c.number) === -1 && natureCourses.indexOf(c.number) === -1 && projectCourses.indexOf(c.number) === -1; ; });
            points.ongoingTech += countECTSPoints(s, function(c) { return c.ongoing && techCourses.indexOf(c.number) > -1; ; });
            points.ongoingNature += countECTSPoints(s, function(c) { return c.ongoing && natureCourses.indexOf(c.number) > -1; ; });
            points.ongoingProject += countECTSPoints(s, function(c) { return c.ongoing && projectCourses.indexOf(c.number) > -1; ; });
            points.ongoingFree += countECTSPoints(s, function(c) { return c.ongoing&& techCourses.indexOf(c.number) === -1 && natureCourses.indexOf(c.number) === -1 && projectCourses.indexOf(c.number) === -1; });
        }
        return points;
    }

    var constructTopBar = function(semesters, techCourses, natureCourses, projectCourses) {
        var points = getPoints(semesters, techCourses, natureCourses, projectCourses),
            title = semesters.filter(function(s){return s.current});
        if (title.length > 0) {
            title = title[0].prettyNumber;
        }
        var topbar = '<div style="text-align: center;margin: 10px 5px 0 10px;">'
            + '<b>Current semester:</b> ' + title 
                + ', <span style="display:inline-block;width:15px;"> </span>'
            + '<b>Passed:</b> <span style="color:green;">' + points.passed + '</span> ECTS'
                + ', <span style="display:inline-block;width:15px;"> </span>'
            + '<b>Ongoing:</b> <span style="color:black;">' + points.ongoing + '</span> ECTS'
                + ', <span style="display:inline-block;width:15px;"> </span>'
            + '<b>Upcoming:</b> <span style="color:black;">' + points.upcoming + '</span> ECTS';
        var categorizedCourses = '<br>'
            + '<b>Technology Core:</b> <span style="color:blue;">' + points.tech 
            + '</span> <span style="color:grey;">(' + points.ongoingTech + ')</span> ECTS'
                + ', <span style="display:inline-block;width:15px;"> </span>'
            + '<b>Electives:</b> <span style="color:black;">' + points.free 
            + '</span> <span style="color:grey;">(' + points.ongoingFree + ')</span> ECTS'
                + ', <span style="display:inline-block;width:15px;"> </span>'
            + '<b>Nature Science:</b> <span style="color:green;">' + points.nature 
            + '</span> <span style="color:grey;">(' + points.ongoingNature + ')</span> ECTS'
                + ', <span style="display:inline-block;width:15px;"> </span>'
            + '<b>Project Based:</b> <span style="color:purple;">' + points.project 
            + '</span> <span style="color:grey;">(' + points.ongoingProject + ')</span> ECTS'
            + '</div>';
        // If the user hasn't set any courses in the options, there's no need to show
        // the categorized courses.
        if ((techCourses.join(',').length + natureCourses.join(',').length + projectCourses.join(',').length) !== 0) {
            topbar += categorizedCourses;
        } else {
            var optionsPage = chrome.extension.getURL("options.html");
            topbar += '<br><a href="' + optionsPage + '">set up courses in extension options</a>';
        }
        $('body').prepend(topbar);
    }
    
    var initExtension = function() {
        // Avoid reexecuting the function.
        if (alreadyParsed) { return; }
        alreadyParsed = true;

        // We construct the top bar using the options the user has supplied
        // in the extension settings.
        chrome.storage.sync.get({
            technologicalCourses: '',
            natureScienceCourses: '',
            projectBasedCourses: ''
        }, function(options) {
            // Avoid executing the function more than once.
            constructTopBar(
                parseSemesters(),
                options.technologicalCourses.split(','),
                options.natureScienceCourses.split(','),
                options.projectBasedCourses.split(',')
            );
        });
    }

    // CampusNet inserts the elements dynamically, so we have to wait
    // for it to exist.
    var alreadyParsed = false;
    $('tr.ContentMain').waitUntilExists(initExtension);
})(jQuery);
