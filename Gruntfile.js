module.exports = function(grunt) {
    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        exec: {
            'app-serve': {
                cwd: 'mobile',
                cmd: 'ionic serve',
            },
            'app-version-patch': {
                cwd: 'mobile',
                cmd: 'npm version patch',
            },
            'app-version-minor': {
                cwd: 'mobile',
                cmd: 'npm version minor',
            },
            'app-version-major': {
                cwd: 'mobile',
                cmd: 'npm version major',
            },
            'app-apply-version': {
                cwd: 'mobile',
                cmd: 'node ./replace.build.js',
            },
            'commit-version': {
                cwd: 'mobile',
                cmd: 'git commit -a -m "version"',
            },
            'app-build': {
                cwd: 'mobile',
                cmd: 'ionic build --prod --service-worker',
            },
            'function-build': {
                cwd: 'mobile',
                cmd: 'ionic build --prod --service-worker',
            },
            'deploy-app': {
                cwd: 'firebase',
                cmd: 'firebase deploy',
            },
            'deploy-www': {
                cwd: 'firebase',
                cmd: 'firebase deploy',
            },
            'deploy-function': {
                cwd: 'firebase',
                cmd: 'firebase deploy',
            },
            'delete-help': {
                cwd: '.',
                cmd: 'rm -rf html',
            }
        },
        markdown: {
            'www-help-build': {
                files: [{
                    expand: true,
                    src: 'mobile/src/assets/help/*.md',
                    dest: 'html/',
                    ext: '.html',
                }]
            }
        },
        copy: {
            copyHelp: {
                src: ['html/mobile/src/assets/help/*.html'],
                dest: 'firebase/hosting/www/help/',
                expand: true,
                flatten: true
            }
        },
    });
    grunt.loadNpmTasks('grunt-exec');
    grunt.loadNpmTasks('grunt-markdown');
    grunt.loadNpmTasks('grunt-copy');

    grunt.registerTask('app-build', 'Build the mobile app', ['exec:app-build']);

    grunt.registerTask('deploy-patch', 'Upgrade to next patch version, commit, build, deploy the mobile app only', [
        'exec:app-version-patch',
        'exec:app-apply-version',
        'exec:commit-version',
        'exec:app-build',
        'exec:deploy-app'
    ]);
    grunt.registerTask('app-deploy-minor', 'Upgrade to next minor version, commit, build, deploy the mobile app only', [
        'exec:app-version-minor',
        'exec:app-apply-version',
        'exec:app-build',
        'exec:deploy-app'
    ]);
    grunt.registerTask('app-deploy-major', 'Upgrade to next major version, commit, build, deploy the mobile app only', [
        'exec:app-version-major',
        'exec:app-apply-version',
        'exec:app-build',
        'exec:deploy-app'
    ]);
    grunt.registerTask('function-deploy', 'Deploy the backend function only', [
        'exec:deploy-function'
    ]);
    grunt.registerTask('www-deploy', 'Deploy the web site only', [
        'exec:deploy-www'
    ]);
    grunt.registerTask('www-help-build', 'Build help pages of the web site', [
        'markdown:www-help-build',
        'copy:copyHelp',
        'exec:delete-help'
    ]);
}