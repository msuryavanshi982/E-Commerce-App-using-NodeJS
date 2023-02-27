const aws=require("aws-sdk")

aws.config.update({
  accessKeyId: "AKIAY3L35MCRZNIRGT6N",
  secretAccessKey: "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",
  region: "ap-south-1"
})

const uploadFile = async (file) => {
  return new Promise(function(resolve, reject){

    const s3 = new aws.S3({appVersion : '2006-03-01'})

    const uploadParams = {
      ACL : "public-read",                //access Controller
      Bucket : "classroom-training-bucket",  // bucket Name
      Key : "abc-aws/" + file.originalname,  //add file in abc-aws folder with requested filename
      Body : file.buffer                     //data or file data, present in file.buffer(in form of packets)
    }
 
    s3.upload(uploadParams, function(err, data){

      if(err) return reject ({error : err})
      return resolve(data.Location)
    })

  }
  )}

module.exports={uploadFile}