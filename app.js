var Q = require('q');
var config = require('./config')();
var exec = require('child_process').exec;

var s3Client = require('knox').createClient({
  key     : config.S3_KEY,
  secret  : config.S3_SECRET,
  bucket  : config.S3_BUCKET
});




capture();
setInterval(capture, 60000);



function capture(){
  gatherCameras()
    .then(takePictures)
    .then(uploadPhotos)
    .then(finish)
    .fail(function(err){
      console.log(err);
    });
}



function gatherCameras(){
  var deferred = Q.defer();

  exec('imagesnap -l', function(error, stdout, stderr) {
    if(stdout){
      var cameras = [];
      var outputArray = stdout.split('\n');

      outputArray.forEach(function(item, i){
        if(item.indexOf('USB') != -1){
          cameras.push(item);
        }
      });

      deferred.resolve({ cameras : cameras });
    } else if(err) deferred.reject(err);
    else deferred.reject(stderr);
  });

  return deferred.promise;
}



function takePictures(opts){
  var deferred = Q.defer();
  var pictures = [];

  opts.cameras.forEach(function(camera, i){
    var timestamp = new Date().getTime();
    var filename  = ['camera', i, timestamp].join('-');
    var filepath  = 'camera-output/' + filename + '.jpg';
    var command   = ['imagesnap -d', camera, filepath].join(' ');

    exec(command, function(error, stdout, stderr) {
      if(stderr) deferred.reject(stderr);
      if(error) deferred.reject(err);
      else {
        pictures.push(filepath);
        if(pictures.length == opts.cameras.length){
          deferred.resolve({ pictures : pictures });
        }
      }
    });
  });

  return deferred.promise;
}



function uploadPhotos(opts){
  var deferred = Q.defer();
  var savedPics = [];

  opts.pictures.forEach(function(pic){
    var s3Path = pic.replace('camera-output', '');
    s3Client.putFile(pic, s3Path, function(err, res){
      if(err) deferred.reject(err);
      else{
        savedPics.push(s3Path);
        if(savedPics.length == savedPics.length){
          deferred.resolve({ picPaths : savedPics });
        }
      }
    });
  });

  return deferred.promise;
}



function finish(opts){
  console.log('Saved ' + opts.picPaths.length + ' pictures');
};
