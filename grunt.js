// require 'https://github.com/alloy/terminal-notifier'
// $ [sudo] gem install terminal-notifier
module.exports = function(grunt) {

  var log = grunt.log;
  var proc = require('child_process');
  var exec = proc.exec;
 
  grunt.registerHelper('exec', function(opts, done) {
    var command = opts.cmd + ' ' + opts.args.join(' ');
    exec(command, opts.opts, function(code, stdout, stderr) {
      if (!done) return;
      if (code === 0) {
        done(null, stdout, code);
      } else {
        done(code, stderr, code);
      }
    });
  });
 
  var handleResult = function handleResult(err, stdout, code, done) {
    if (err) {
      log.writeln(stdout);
      done(false);
    } else {
      log.writeln('complete!');
      done(true);
    }
  };

  // Notification Center
  (function() {
    function showNotif(type, msg) {
      var title = 'Grunt building task';
      var activateId = null;
      var output = null;
      if ( type === 'ok' ) {
        msg = 'all tasks are done.';
      } else {
        activateId = ' -activate "com.apple.Terminal"';
      }
      output = [
        'terminal-notifier ',
        '-message "',
        msg,
        '" -title "',
        title,
        (type !== 'ok') ? '" -subtitle "' + type : '',
        '" -group ',
        type,
        activateId
      ].join('');
      proc.exec(output);
    }
    grunt.utils.hooker.hook(grunt, 'initConfig', {
      once: true,
      post: function() {
        grunt.utils.hooker.hook(grunt.log, 'write', function(msg) {
          msg = grunt.log.uncolor(msg);
          if ( msg.match(/^Done,/) ) {
            showNotif('ok');
          }
        });
        grunt.utils.hooker.hook(grunt.fail, 'warn', function(error) {
          if ( typeof error !== 'undefined' ) {
            showNotif('warn', error.message);
          }
        });
        grunt.utils.hooker.hook(grunt.fail, 'error', function(msg) {
          if ( typeof msg === 'string' ) {
            showNotif('error', 'error');
          }
        });
        grunt.utils.hooker.hook(grunt.log, 'ok', function(msg) {
          if ( typeof msg === 'string' ) {
            showNotif('ok');
          }
        });
      }
    });
  }());

  // Sass
  (function (grunt) {
    grunt.registerHelper('sassc', function (from, dest, done) {
      var args = { cmd:'sass', args:[ from + ':' + dest] };
      grunt.helper('exec', args, function (err, stdout, code) {
        handleResult(err, stdout, code, done);
      });
    });
    grunt.registerMultiTask('sass', 'compile sass', function () {
      grunt.helper('sassc', this.data.src, this.data.dest, this.async());
    });
  }(grunt));

  grunt.initConfig({
    pkg: '<json:package.json>',
    meta: {
      banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
        '<%= grunt.template.today("yyyy-mm-dd H:MM:ss") %>\n' +
        '<%= pkg.homepage ? "* " + pkg.homepage + "\n" : "" %>' +
        '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
        ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */'
    },
    sass: {
      dist: {
        src: ['_source/_scss/style.scss'],
        dest: 'styles/style.css'
      }
    },
    concat: {
      dist: {
        src: ['<banner:meta.banner>', '<file_strip_banner:_source/_scripts/<%= pkg.name %>.js>'],
        dest: 'scripts/<%= pkg.name %>.js'
      }
    },
    min: {
      dist: {
        src: ['<banner:meta.banner>', '<config:concat.dist.dest>'],
        dest: 'scripts/<%= pkg.name %>.min.js'
      }
    },
    lint: {
      files: ['grunt.js', '_scripts/*.js']
    },
    watch: {
      files: ['_source/_scripts/*.js', '_source/_scss/*.scss'],
      tasks: 'sass concat min'
    }
  });

  grunt.registerTask('default', 'sass lint concat min');
};
