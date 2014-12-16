// Saves options to chrome.storage
function save_options() {
    var technologicalCourses = document.getElementById('technologicalCourses').value;
    var natureScienceCourses = document.getElementById('natureScienceCourses').value;
    var projectBasedCourses = document.getElementById('projectBasedCourses').value;
    chrome.storage.sync.set({
        technologicalCourses: technologicalCourses,
        natureScienceCourses: natureScienceCourses,
        projectBasedCourses: projectBasedCourses
    }, function() {
        // Update status to let user know options were saved.
        var status = document.getElementById('status');
        status.textContent = 'Options saved.';
        setTimeout(function() {
            status.textContent = '';
        }, 750);
    });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
    // Use default value
    chrome.storage.sync.get({
        technologicalCourses: '',
        natureScienceCourses: '',
        projectBasedCourses: ''
    }, function(items) {
        document.getElementById('technologicalCourses').value = items.technologicalCourses;
        document.getElementById('natureScienceCourses').value = items.natureScienceCourses;
        document.getElementById('projectBasedCourses').value = items.projectBasedCourses;
    });
}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);