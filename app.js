var Q = require('q');
var exec = require('child_process').exec;


gatherCameras()
  .then(takePictures)
  .then(uploadPhotos)
  .fail(function(err){
    console.log(err);
  });



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
};



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
  opts.pictures.forEach(function(pic){
    console.log(pic);
  });
}
