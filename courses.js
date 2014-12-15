(function ($) {

/**
* @function
* @property {object} jQuery plugin which runs handler function once specified element is inserted into the DOM
* @param {function} handler A function to execute at the time when the element is inserted
* @param {bool} shouldRunHandlerOnce Optional: if true, handler is unbound after its first invocation
* @example $(selector).waitUntilExists(function);
*/

$.fn.waitUntilExists    = function (handler, shouldRunHandlerOnce, isChild) {
    var found       = 'found';
    var $this       = $(this.selector);
    var $elements   = $this.not(function () { return $(this).data(found); }).each(handler).data(found, true);

    if (!isChild)
    {
        (window.waitUntilExists_Intervals = window.waitUntilExists_Intervals || {})[this.selector] =
            window.setInterval(function () { $this.waitUntilExists(handler, shouldRunHandlerOnce, true); }, 500)
        ;
    }
    else if (shouldRunHandlerOnce && $elements.length)
    {
        window.clearInterval(window.waitUntilExists_Intervals[this.selector]);
    }

    return $this;
}

}(jQuery));

(function($){
    var alreadyParsed = false;
    var parseSemesters = function() {
        // Avoid executing the function more than once.
        if (alreadyParsed) { return; }
        alreadyParsed = true;
        
        var semesters = {};
        var plannerDivs = $('.plannerContentDiv');
        
        plannerDivs.each(function(i) {
            var title = $('.semesterHeader', plannerDivs[i]).first().text(),
                semester = $('.periodTable', plannerDivs[i]).first(),
                currentSemester = false,
                courses = parseCourses(semester),
                number = i+1,
                prettyNumber = number + "th";
            if ($('.periodTable', plannerDivs[i]).length > 2) {
                courses = courses.concat(
                    parseCourses($('.periodTable', plannerDivs[i]).first().next().next())
                );
            }
            if (title == '') {
                currentSemester = true;
                title = $('.presentSemesterHeader', plannerDivs[i]).first().text().slice(0,11);
            }
            if (number == 1) { 
                prettyNumber = number + "st" ;
            } else if (number == 2) { 
                prettyNumber = number + "nd";
            } else if (number == 3) { 
                prettyNumber = number + "rd";
            }
            
            semesters[i] = {
                title: title,
                current: currentSemester,
                number: number,
                prettyNumber: prettyNumber,
                courses: courses
            }
        });
        
        chrome.storage.sync.get(null, function(options) {
            options.technologicalCourses
            constructTopBar(
                semesters,
                options.technologicalCourses.split(','),
                options.natureScienceCourses.split(','),
                options.projectBasedCourses.split(',')
            );
        });
    }
    
    var parseCourses = function(semester) {
        // The first tr in the table is the table header, so we
        // ignore that.
        var courses = $('tr', semester).slice(1);
        var courseCollection = [];
        
        courses.each(function(i) {
            var courseNumber = $('.coursecode', courses[i]).text().split(" ").slice(0,1)[0],
                courseECTS = $('.ects', courses[i]).text().split(" ").slice(0,1)[0],
                courseStatus = $('.CourseStatus', courses[i]).text(),
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
            courseCollection.push({
                number: courseNumber,
                ECTS: courseECTS,
                passed: passed,
                ongoing: ongoing,
                upcoming: upcoming,
                planned: planned
            });
        });
        return courseCollection;
    }
    
    var getCourses= function(semester, check) {
        var points = 0.0;
        for(i in semester.courses) {
            var course = semester.courses[i];
            if (check(course)) {
                points += parseFloat(course.ECTS.replace(',', '.'));
            }
        }
        return points;
    }
    
    var getCategory = function(semester, check, categoryCourses) {
        var points = 0.0;
        for(i in semester.courses) {
            var course = semester.courses[i];
            if (check(course) && categoryCourses.indexOf(course.number) > -1) {
                points += parseFloat(course.ECTS.replace(',', '.'));
            }
        }
        return points;
    }
    
    var getFree = function(semester, check, techCourses, natureCourses, projectCourses) {
        var points = 0.0;
        for(i in semester.courses) {
            var course = semester.courses[i];
            if (check(course) 
                && techCourses.indexOf(course.number) === -1
                && natureCourses.indexOf(course.number) === -1
                && projectCourses.indexOf(course.number) === -1) {
                points += parseFloat(course.ECTS.replace(',', '.'));
            }
        }
        return points;
    }
    
    var constructTopBar = function(semesters, techCourses, natureCourses, projectCourses) {
        var title = '',
            passed = 0,
            tech = 0,
            ongoingTech = 0,
            free = 0,
            ongoingFree = 0,
            nature = 0,
            ongoingNature = 0,
            project = 0,
            ongoingProject = 0,
            ongoing = 0,
            upcoming = 0;
        for (i in semesters) {
            var semester = semesters[i];
            if (semester.current) {
                title = semester.prettyNumber;
            }
            passed += getCourses(semester, function(c) { return c.passed; });
            ongoing += getCourses(semester, function(c) { return c.ongoing; });
            upcoming += getCourses(semester, function(c) { return c.upcoming; });
            tech += getCategory(semester, function(c) { return c.passed; }, techCourses);
            nature += getCategory(semester, function(c) { return c.passed; }, natureCourses);
            project += getCategory(semester, function(c) { return c.passed; }, projectCourses);
            free += getFree(semester, function(c) { return c.passed; }, techCourses, natureCourses, projectCourses);
            ongoingTech += getCategory(semester, function(c) { return c.ongoing; }, techCourses);
            ongoingNature += getCategory(semester, function(c) { return c.ongoing; }, natureCourses);
            ongoingProject += getCategory(semester, function(c) { return c.ongoing; }, projectCourses);
            ongoingFree += getFree(semester, function(c) { return c.ongoing; }, techCourses, natureCourses, projectCourses);
        }
        $('body').prepend(
            '<div style="text-align: center;margin: 10px 5px 0 10px;">'
            + '<b>Current semester:</b> ' + title 
            + ', <span style="display:inline-block;width:15px;"> </span>'
            + '<b>Passed:</b> <span style="color:green;">' + passed + '</span> ECTS'
            + ', <span style="display:inline-block;width:15px;"> </span>'
            + '<b>Ongoing:</b> <span style="color:black;">' + ongoing + '</span> ECTS'
            + ', <span style="display:inline-block;width:15px;"> </span>'
            + '<b>Upcoming:</b> <span style="color:black;">' + upcoming + '</span> ECTS'
            + '<br>'
            + '<b>Technology Core:</b> <span style="color:blue;">' + tech 
            + '</span> <span style="color:grey;">(' + ongoingTech + ')</span> ECTS'
            + ', <span style="display:inline-block;width:15px;"> </span>'
            + '<b>Electives:</b> <span style="color:black;">' + free 
            + '</span> <span style="color:grey;">(' + ongoingFree + ')</span> ECTS'
            + ', <span style="display:inline-block;width:15px;"> </span>'
            + '<b>Nature Science:</b> <span style="color:green;">' + nature 
            + '</span> <span style="color:grey;">(' + ongoingNature + ')</span> ECTS'
            + ', <span style="display:inline-block;width:15px;"> </span>'
            + '<b>Project Based:</b> <span style="color:purple;">' + project 
            + '</span> <span style="color:grey;">(' + ongoingProject + ')</span> ECTS'
            + '</div>'
        );
    }
    
    // CampusNet inserts the elements dynamically, so we have to wait
    // for it to exist.
    $('tr.ContentMain').waitUntilExists(parseSemesters);
})(jQuery);
