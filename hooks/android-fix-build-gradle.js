var fs = require('fs-extra');

console.log('Copying build-extras.gradle to android platform...');

try {
	fs.copySync('res/android/build/build-extras.gradle', 'platforms/android/build-extras.gradle');
} catch (e) {
	console.error('Failed to copying build-extras.gradle to android platform: ', e.message);
	process.exit(1);
}