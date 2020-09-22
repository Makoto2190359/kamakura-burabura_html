const autoprefixer = require("autoprefixer");
const gulp = require("gulp");
// const changed = require('gulp-changed');
const csscomb = require('gulp-csscomb');
const cssnano = require('gulp-cssnano');
const eslint = require('gulp-eslint');
const gulpif = require('gulp-if');
const imagemin = require('gulp-imagemin');
const notify = require("gulp-notify");
const plumber = require("gulp-plumber");
const postcss = require('gulp-postcss');
const pug = require("gulp-pug");
const sass = require('gulp-sass');
const sourcemaps = require('gulp-sourcemaps');
const webserver = require('gulp-webserver');
const gutil = require('gutil');
const pngquant = require('imagemin-pngquant');  // 圧縮率を高めるのにプラグインを入れる png
const mozjpeg = require('imagemin-mozjpeg');  // 圧縮率を高めるのにプラグインを入れる jpg
const minimist = require("minimist");

const paths = {
  pug: [
    './src/pug/**/*.pug',
    '!./src/pug/**/_*.pug',
    '!./src/pug/_**/*.pug'
  ],
  sass: [
    './src/sass/**/*.scss',
    '!./src/sass/**/_*.scss',
    '!./src/sass/_**/*.scss',
  ],
  scripts: [
    './src/script/**/*.js',
  ],
  assets: [
    './src/assets/**/*.{png,jpg,gif,svg}'
  ]
};

const envOption = {
  string: 'env',
  default: {
    env: process.env.NODE_ENV || 'development',
  },
};
const options = minimist(process.argv.slice(2), envOption);
const isProd = options.env === 'production';

gulp.task('server', () => {
  return gulp.src('./dist')
    .pipe(
      webserver({
        host: 'localhost',
        livereload: true, // 監視不要ならfalse
        port: 8000,
      }));
});

// pugコンパイル
gulp.task("pug", () => {
  return gulp.src(paths.pug)
    .pipe(
      plumber({ errorHandler: notify.onError("Error: <%= error.message %>") }))
    .pipe(
      pug({
        pretty: '\t',
      }))
    .pipe(gulp.dest('./dist/kamakura-burabura/html'));
});

// sassコンパイル
gulp.task('sass', () => {
  return gulp.src(paths.sass)
    .pipe(
      gulpif(!isProd, sourcemaps.init()))
    .pipe(plumber())
    .pipe(
      sass({
        outputStyle: 'expanded',
      }).on('error', sass.logError))
    .pipe(
      sourcemaps.write())
    .pipe(
      postcss(autoprefixer).on('error', gutil.log))
    .pipe(csscomb())
    .pipe(
      gulpif(!isProd, sourcemaps.write()))
    .pipe(
      gulpif(isProd,cssnano({discardComments: {
            removeAll: true,
          },
        }))
    )
    .pipe(gulp.dest('./dist/kamakura-burabura/css'));
});

// js 構文チェック
gulp.task('lint-scripts', () => {
  return gulp.src(paths.scripts)
    .pipe(eslint({
      useEslintrc: true}))
    .pipe(eslint.format());
});

// jsコンパイル
gulp.task('parcel', () => {
  return gulp
    .src(paths.scripts, {
      read: false,
    })
    .pipe(
      gulpif(
        !isProd,
        parcel({
          source: 'parcel',
        }),
      ),
    )
    .pipe(
      gulpif(
        isProd,
        parcel(
          {
            cache: false,
            minify: true,
          },
          {
            source: 'parcel',
          },
        ),
      ),
    )
    .pipe(gulp.dest('./dist/kamakura-burabura/js'));
});

// 画像圧縮
gulp.task('assets', () => {
  return gulp.src(paths.assets)
    // .pipe(changed())  // src と dist を比較して異なるものだけ処理
    .pipe(imagemin([
      pngquant({
        quality: [.65, .8],  // 画質
        speed: 1,  // 最低のスピード
        floyd: 0,  // ディザリングなし
      }),
      mozjpeg({
        quality: 85, // 画質
        progressive: true
      }),
      imagemin.svgo(),
      imagemin.optipng(),
      imagemin.gifsicle()
    ]))
    .pipe(gulp.dest('./dist/kamakura-burabura/images'))
    .pipe(notify('&#x1f363; images task finished &#x1f363;'));
});

gulp.task('watch', () => {
  gulp.watch(['src/pug/**/*.pug'], gulp.task('pug'));
  gulp.watch(['src/sass/**/*.scss'], gulp.task('sass'));
  gulp.watch(['src/script/**/*.js'], gulp.task('lint-scripts'));
  gulp.watch(['src/assets/**/*'], gulp.task('assets'));
});

gulp.task(
  'build',
  gulp.series(
    gulp.parallel('pug', 'sass', 'lint-scripts', 'assets'))
);
gulp.task('default', gulp.series(gulp.parallel('server', 'watch')));