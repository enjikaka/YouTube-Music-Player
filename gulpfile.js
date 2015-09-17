var gulp = require('gulp'),
    sass = require('gulp-sass'),
    autoprefixer = require('gulp-autoprefixer'),
    browserSync = require('browser-sync'),
    browserify = require('gulp-browserify');

gulp.task('styles', function() {
    /*
    For every .scss file in the scss directory:
      - Compile SCSS to CSS
      - Run it through Rucksack
      - Output to CSS directory
  */
    gulp.src('./app/scss/*.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(autoprefixer({
            browsers: ['last 2 versions'],
            cascade: false
        }))
        .pipe(gulp.dest('./dist/css'))
        .pipe(browserSync.reload({
            stream: true
        })
    );
});

gulp.task('browserSync', function() {
    browserSync({
        server: {
            baseDir: 'dist'
        }
    });
});

gulp.task('browserify', function() {
  return gulp.src('./app/app.js')
    .pipe(browserify())
    .pipe(gulp.dest('./dist/')).pipe(browserSync.reload({
        stream: true
    }));
});

gulp.task('watch', ['browserify', 'browserSync'], function() {
    /*
    When file changes in directory named "scss":
      - Run the "styles" task
    */
    
    gulp.watch('app/scss/*.scss', ['styles']);
    gulp.watch('app/*.html', ['html']);
    gulp.watch('app/*.js', ['browserify']);
});

gulp.task('html', function() {
    gulp.src('app/*.html')
        .pipe(gulp.dest('./dist'))
        .pipe(browserSync.reload({
            stream: true
        }));
});

gulp.task('build', ['styles'], function() {
    gulp.src('app/css/*.css')
        .pipe(gulp.dest('./dist/css'));

    gulp.src('app/*.html')
        .pipe(gulp.dest('./dist'));
});