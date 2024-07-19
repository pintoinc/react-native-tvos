/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

/**
 * This script is derived from npm-publish.js.
 * It prepares a release version of react-native-tvos.
 *
 *  * Create Android artifacts
 *  * Copy hermesc from react-native core release
 *  * It will not publish to npm
 *
 */

const releaseVersion =
  require('../../packages/react-native/package.json').version;
const {generateAndroidArtifacts} = require('./utils/release-utils');
const fs = require('fs');
const fs_extra = require('fs-extra');
const os = require('os');
const path = require('path');
const {echo, exec, exit} = require('shelljs');
const {Readable} = require('stream');
const {finished} = require('stream/promises');

const downloadFile = async (url, destinationDir, fileName) => {
  const res = await fetch(url);
  const destination = path.resolve(destinationDir, fileName);
  const fileStream = fs.createWriteStream(destination, {flags: 'wx'});
  await finished(Readable.fromWeb(res.body).pipe(fileStream));
};

const executeScriptAsync = async function () {
  const HERMES_INSTALL_LOCATION = 'packages/react-native/sdks';
  const HERMES_SOURCE_DEST_PATH = `${HERMES_INSTALL_LOCATION}/hermes`;
  let extraHermesDirectoryPath;

  let hermesReleaseTag;
  let hermesReleaseURI;
  try {
    hermesReleaseTag = fs
      .readFileSync('node_modules/react-native-core/sdks/.hermesversion', {
        encoding: 'utf8',
        flag: 'r',
      })
      .trim();
    hermesReleaseURI = `https://github.com/facebook/hermes/archive/refs/tags/${hermesReleaseTag}.tar.gz`;
    extraHermesDirectoryPath = `${HERMES_INSTALL_LOCATION}/hermes/hermes-${hermesReleaseTag}`;
  } catch (err) {
    echo('Failed to read current Hermes release tag.');
    // TODO: We'll need to make sure every release going forward has one of these.
    exit(1);
  }

  // Copy hermesc from RN core release
  const HERMESC_SOURCE_LOCATION = 'node_modules/react-native-core/sdks/hermesc';
  const HERMESC_DEST_LOCATION = `${HERMES_INSTALL_LOCATION}/hermesc`;
  fs_extra.copySync(HERMESC_SOURCE_LOCATION, HERMESC_DEST_LOCATION, {
    overwrite: true,
  });

  const tmpDownloadDir = fs.mkdtempSync(
    path.join(os.tmpdir(), 'hermes-tarball'),
  );
  const tmpExtractDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hermes'));

  const hermesInstallScript = `
    tar -xzf ${tmpDownloadDir}/hermes.tar.gz -C ${tmpExtractDir} && \
    HERMES_SOURCE_EXTRACT_PATH=$(ls -d ${tmpExtractDir}/*) && \
    mv $HERMES_SOURCE_EXTRACT_PATH ${HERMES_SOURCE_DEST_PATH}
  `;

  if (fs.existsSync(`${HERMES_SOURCE_DEST_PATH}`)) {
    if (exec(`rm -rf ./${HERMES_SOURCE_DEST_PATH}`).code) {
      echo('Failed to clean up previous Hermes installation.');
      exit(1);
    }
  }

  fs.mkdirSync(HERMES_SOURCE_DEST_PATH, {recursive: true});

  echo(`Downloading Hermes from ${hermesReleaseURI}...`);
  await downloadFile(hermesReleaseURI, tmpDownloadDir, 'hermes.tar.gz');
  echo('Download complete.');

  if (exec(hermesInstallScript).code) {
    echo('Failed to include Hermes in release.');
    exit(1);
  }

  if (extraHermesDirectoryPath) {
    echo('Cleanup extra hermes directory...');
    fs.rmSync(extraHermesDirectoryPath, {recursive: true, force: true});
    echo(`Removed ${extraHermesDirectoryPath}.`);
  }

  // generate Maven artifacts in /tmp/maven-local
  generateAndroidArtifacts(releaseVersion);

  echo(`Release prepared for version ${releaseVersion}`);

  exit(0);
};

executeScriptAsync();
