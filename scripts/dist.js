// Copyright (c) 2015-present, salesforce.com, inc. All rights reserved
// Licensed under BSD 3-Clause - see LICENSE.txt or git.io/sfdc-license
require('@babel/register');

const fs = require('fs');
const path = require('path');
const async = require('async');
const autoprefixer = require('autoprefixer');
const gulp = require('gulp');
const gulpinsert = require('gulp-insert');
const gulprename = require('gulp-rename');
const postcss = require('gulp-postcss');
const rimraf = require('rimraf');
const sass = require('gulp-sass');
const minifycss = require('gulp-minify-css');
const packageJSON = require('../package.json');
const paths = require('./helpers/paths');

const NDS_VERSION = packageJSON.version;
const DISPLAY_NAME = 'Vlocity Newport Design System';
const MODULE_NAME = 'vlocity-newport-design-system';

// /////////////////////////////////////////////////////////////
// Helpers
// /////////////////////////////////////////////////////////////

const distPath = path.resolve.bind(path, paths.dist);

// /////////////////////////////////////////////////////////////
// Tasks
// /////////////////////////////////////////////////////////////

async.series(
  [
    /**
   * Clean the dist folder
   */
    done => rimraf(distPath(), done),

    /**
   * Copy necessary root files to be included in the final module
   */
    done => {
      gulp
        .src(['./package.json', './README-dist.md', './RELEASENOTES*'], {
          base: paths.root
        })
        .pipe(gulp.dest(distPath()))
        .on('error', done)
        .on('finish', done);
    },

    /**
   * Cleanup the package.json
   */
    done => {
      const packageJSON = JSON.parse(
        fs.readFileSync(distPath('package.json')).toString()
      );
      packageJSON.name = '@vlocity/newport-design-system';
      delete packageJSON.scripts;
      delete packageJSON.dependencies;
      delete packageJSON.devDependencies;
      delete packageJSON.optionalDependencies;
      delete packageJSON.engines;
      delete packageJSON.important;
      fs.writeFile(
        distPath('package.json'),
        JSON.stringify(packageJSON, null, 2),
        done
      );
    },

    // //////////////////////////////////
    // Sass
    // //////////////////////////////////

    /**
   * Move all the scss files to dist/scss
   */
    done => {
      gulp
        .src(['**/*.scss', '**/*.rtl.scss'], {
          base: paths.ui,
          cwd: paths.ui
        })
        .pipe(gulp.dest(distPath('scss')))
        .on('error', done)
        .on('finish', done);
    },

    /**
   * Copy the Sass license
   */
    done => {
      gulp
        .src('licenses/License-for-Sass.txt', {
          cwd: paths.assets
        })
        .pipe(gulp.dest(distPath('scss')))
        .on('error', done)
        .on('finish', done);
    },

    // //////////////////////////////////
    // Icons
    // //////////////////////////////////

    /**
   * Copy all the icons to assets/icons
   */
    done => {
      gulp
        .src(
          '@salesforce-ux/icons/dist/salesforce-lightning-design-system-icons/**',
          {
            cwd: paths.node_modules
          }
        )
        .pipe(gulp.dest(distPath('assets/icons')))
        .on('error', done)
        .on('finish', done);
    },

    /**
   * Copy the list to assets/icons
   */
    done => {
      gulp
        .src('@salesforce-ux/icons/dist/ui.icons.json', {
          cwd: paths.node_modules
        })
        .pipe(gulp.dest(distPath()))
        .on('error', done)
        .on('finish', done);
    },

    // //////////////////////////////////
    // Fonts
    // //////////////////////////////////

    /**
   * Copy all the fonts to assets/fonts
   */
    done => {
      gulp
        .src(['fonts/**/*', '!**/*.ttf'], {
          cwd: paths.assets
        })
        .pipe(gulp.dest(distPath('assets/fonts')))
        .on('error', done)
        .on('finish', done);
    },

    /**
   * Copy font license
   */
    done => {
      gulp
        .src('licenses/License-for-font.txt', {
          cwd: paths.assets
        })
        .pipe(gulp.dest(distPath('assets/fonts')))
        .on('error', done)
        .on('finish', done);
    },

    // //////////////////////////////////
    // Images
    // //////////////////////////////////

    //   /**
    //  * Copy select images directories
    //  */
    done => {
      gulp
        .src(['images/**/*', '!images/themes/**/*'], {
          base: 'assets/images',
          cwd: paths.assets
        })
        .pipe(gulp.dest(distPath('assets/images')))
        .on('error', done)
        .on('finish', done);
    },

    /**
   * Copy images license
   */
    done => {
      gulp
        .src('licenses/License-for-images.txt', {
          cwd: paths.assets
        })
        .pipe(gulp.dest(distPath('assets/images')))
        .on('error', done)
        .on('finish', done);
    },

    // //////////////////////////////////
    // Swatches
    // //////////////////////////////////

    /**
   * Copy the swatches
   */
    done => {
      gulp
        .src('downloads/swatches/**', {
          cwd: paths.assets
        })
        .pipe(gulp.dest(distPath('swatches')))
        .on('error', done)
        .on('finish', done);
    },

    // //////////////////////////////////
    // Design Tokens
    // //////////////////////////////////

    /**
   * Move design tokens
   */
    done => {
      gulp
        .src('**/*.*', {
          base: `${paths.designTokens}`,
          cwd: `${paths.designTokens}`
        })
        .pipe(gulp.dest(distPath('design-tokens')))
        .on('error', done)
        .on('finish', done);
    },

    /**
   * Move component design tokens
   */
    done => {
      gulp
        .src('components/**/tokens/**/*.yml', {
          base: path.resolve(paths.ui),
          cwd: path.resolve(paths.ui)
        })
        .pipe(gulp.dest(distPath('ui')))
        .on('error', done)
        .on('finish', done);
    },

    /**
   * Build design system and vf css from the scss files. The big one!
   */
    done => {
      gulp
        .src([
          distPath('scss/index-scoped.scss'),
          distPath('scss/index-scoped.rtl.scss'),
          distPath('scss/nds-fonts.scss')
        ])
        .pipe(
          sass({
            precision: 10,
            includePaths: [paths.node_modules]
          })
        )
        .pipe(sass().on('error', sass.logError))
        .pipe(postcss([autoprefixer({ remove: false })]))
        .pipe(
          gulprename(function(path) {
            if (!/nds-fonts/.test(path.basename)) {
              path.basename =
                MODULE_NAME + path.basename.substring('index-scoped'.length);
            }
            path.extname = '.css';
            return path;
          })
        )
        .pipe(gulp.dest(distPath('assets/styles/')))
        .on('error', done)
        .on('finish', done);
    },
    /**
   * Minify CSS
   */
    done => {
      gulp
        .src(
          [
            distPath('assets/styles/*.css'),
            distPath('assets/styles/*.rtl.css')
          ],
          { base: distPath() }
        )
        .pipe(gulp.dest(distPath()))
        .on('error', done)
        .pipe(
          minifycss({
            advanced: false,
            roundingPrecision: '-1'
          })
        )
        .pipe(
          gulprename(function(path) {
            path.basename += '.min';
            return path;
          })
        )
        .on('error', done)
        .pipe(gulp.dest(distPath()))
        .on('error', done)
        .on('finish', done);
    },

    /**
   * Add version to relevant CSS and Sass files
   */
    done => {
      gulp
        .src(['**/*.css', '**/*.rtl.css', 'scss/index*'], {
          base: distPath(),
          cwd: distPath()
        })
        .pipe(gulpinsert.prepend(`/*! ${DISPLAY_NAME} ${NDS_VERSION} */\n`))
        .pipe(gulp.dest(distPath()))
        .on('error', done)
        .on('finish', done);
    },
    done => {
      gulp
        .src(['scss/**/*.scss', '!scss/index*.scss', '!scss/vendor/**/*.*'], {
          base: distPath(),
          cwd: distPath()
        })
        .pipe(gulpinsert.prepend(`// ${DISPLAY_NAME} ${NDS_VERSION}\n`))
        .pipe(gulp.dest(distPath()))
        .on('error', done)
        .on('finish', done);
    },

    /**
   * Add build date to README.txt
   */
    done => {
      gulp
        .src(distPath('README-dist.md'))
        .pipe(gulprename('README.md'))
        .on('error', done)
        .pipe(
          gulpinsert.prepend(`# ${DISPLAY_NAME} \n# Version: ${NDS_VERSION} \n`)
        )
        .on('error', done)
        .pipe(gulp.dest(distPath()))
        .on('error', done)
        .on('finish', done);
    },

    /**
   * Remove old README-dist
   */
    done => {
      rimraf(distPath('README-dist.md'), done);
    },
    done => {
      rimraf(distPath('swatches'), done);
    },
    done => {
      rimraf(distPath('design-tokens'), done);
    },
    done => {
      rimraf(distPath('ui'), done);
    },
    done => {
      rimraf(distPath('scss'), done);
    },
    done => {
      rimraf(distPath('__internal'), done);
    },
    done => {
      rimraf(distPath('assets/icons/**/*.png'), done);
    }
  ],
  err => {
    if (err) throw err;
  }
);
