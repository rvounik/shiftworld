module.exports = function(grunt) {

    // project configuration
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        browserify: {
            "build": {
                "options": {
                    "transform": [
                        "babelify"
                    ],
                    "watch": false,
                    "keepAlive": false
                },
                "files": {
                    "js/build/compiled.js": "js/src/shiftworld.js"
                }
            }
        },
        copy: {
            options: {
                punctuation: ''
            },
            js: {
                files: {
                    'web/js/shiftworld.js': ['js/build/compiled.js']
                }
            },
            vendor: {
                files: {
                    'web/js/vendor/polyfill.js': ['node_modules/babel-polyfill/dist/polyfill.min.js']
                }
            }
        },
        clean: {
            "build": [
                "js/build"
            ],
            "web": [
                "web/js",
                "web/css"
            ]
        },
        uglify: {
            "js": {
                "files": {
                    "js/build/compiled.js": ["js/build/compiled.js"]
                }
            }
        },
        compass: {
            "build": {
                "options": {
                    "importPath": [
                        "node_modules"
                    ],
                    "sassDir": [
                        "css/src"
                    ],
                    "cssDir": "web/css/",
                    "environment": "production",
                    "noLineComments": false,
                    "outputStyle": "compressed",
                    "specify": "css/src/screen.scss"
                }
            }
        },
        watch: {
            "project": {
                "files": [
                    "js/src/*.js",
                    "css/src/**"
                ],
                "tasks": [
                    'clean:build',
                    "browserify:build",
                    'clean:web',
                    'compass:build',
                    "copy:js",
                    'copy:vendor'
                ]
            }
        }
    });

    // load the plugins
    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-copy');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-compass');

    // register tasks
    grunt.registerTask(
        'default',
        [
            'clean:build',
            'browserify:build',
            'clean:web',
            'compass:build',
            'copy:js',
            'copy:vendor',
            'watch:project'
        ]
    );

    grunt.registerTask(
        'deploy',
        [
            'clean:build',
            'browserify:build',
            'clean:web',
            'compass:build',
            'uglify:js',
            'copy:js',
            'copy:vendor'
        ]
    );

};
