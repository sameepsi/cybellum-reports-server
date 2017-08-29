var express = require("express");
var router = express.Router({mergeParams:true});
var mongoose = require("mongoose");

var {getEditableFields, getCustomFields} = require("./Constants")
var {Document} = require("../../../models/document");
var {Folder} = require("../../../models/folder");


const checkIfValidMongoObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
}

router.get("/document/editableFields", async(req, res) => {
  res.status(200).send(getEditableFields());
});
router.get("/document/customFields", async(req, res) => {
  res.status(200).send(getCustomFields());
});
router.put("/document/:id", async(req, res)=>{
  try  {
    var body = req.body;
    var id = req.params.id;
    if(!checkIfValidMongoObjectId(id)){
      res.status(500).send();
    }

    if(body && Object.keys(body).length>0 ){
      Object.keys(body).forEach((key)=>{
        if(getEditableFields().indexOf(key)===-1){
          return res.status(500).send();
        }
      });
      var document = await Document.findOneAndUpdate({_id:mongoose.Types.ObjectId(id)},{
        $set:body
      },{new: true})
      res.status(200).send(document);
    }
    res.status(500).send();
  } catch(err) {
    console.log(err);
    res.status(500).send();
  }
});

//returns a document corresponding to the id
router.get("/document/:id", async(req, res) => {
  try{
    var id = req.params.id;
    if(!checkIfValidMongoObjectId(id)){
      res.status(500).send();
    }
    var document = await Document.findById(id);
    return res.status(200).send(document);
  }catch(err){
    res.status(500).send();
  }
});
//return all documents inside of a folder
router.get("/folder/:id/document", async(req, res)=>{
  try{
    var folderId = req.params.id;
    console.log(req.query);
    var limit = req.query.limit || 10;
    var page = req.query.page || 1;
    if(limit>100){
      limit = 100;
    }
    limit = parseInt(limit);
    page = parseInt(page);
    console.log(folderId);
    if((folderId!=="0" && folderId!=="-1") && !checkIfValidMongoObjectId(folderId)){
      console.log("yes")
      return res.status(500).send();
    }
    var query = {};

    if(folderId!=="0" && folderId!=="-1"){
      var folder = await Folder.findById(folderId);
      if(!folder && folderId!==0){
        return res.status(500).send();
      }
      if(folder){
        var documentIds =[];
        for(let doc of folder.document){
          documentIds.push(mongoose.Types.ObjectId(doc));
        }
        query = {
          '_id':{
            $in:documentIds
          }
        }
      }
      else{
        return res.status(500).send();
      }
    }

    else if(folderId==="0"){
      query={
        parent_folder: { $exists: false }
      };
    }

    var documents = await Document.paginate(query,{ page, limit });
    return res.status(200).send(documents);
  }catch(err){
    console.log(err);
    res.status(500).send();
  }
});

router.delete("/folder/:id/document", async(req, res) => {
  try{
    var folderId = req.params.id;
    var documentIds = req.body.documents;
    if(!checkIfValidMongoObjectId(folderId)){
      console.log("aa");
      return res.status(500).send();
    }

    var folder = await Folder.findById(folderId);
    if(folder){

      if(!documentIds){
        documentIds = [];
      for(let doc of folder.document){
        documentIds.push(mongoose.Types.ObjectId(doc));
      }
    }
      var documents = await Document.updateMany({
        '_id':{
          $in:documentIds
        }
      },{
        $unset:{
          parent_folder:undefined
        }
      });
      folder.document = folder.document.filter( function( el ) {
          return documentIds.indexOf( el.toString() ) < 0;
} );
      await folder.save();
      return res.status(200).send("ok");
    }
    res.status(500).send();
  }catch(err){
    console.log(err);

    res.status(500).send();
  }
});


router.delete("/folder/:id/document/:docId", async(req, res) => {
  try{
    var folderId = req.params.id;
    var docId = req.params.docId;
    if(!checkIfValidMongoObjectId(folderId) || !checkIfValidMongoObjectId(docId)){
      return res.status(500).send();
    }

    var folder = await Folder.findById(folderId);
    if(folder){
      var documentIds =[];
      documentIds.push(mongoose.Types.ObjectId(docId));

      var documents = await Document.updateMany({
        '_id':{
          $in:documentIds
        }
      },{
        $unset:{
          parent_folder:undefined
        }
      });
      var index = folder.document.indexOf(docId);
      if(index> -1){
        folder.document.splice(index, 1);
        await folder.save();
      }

      return res.status(200).send();
    }
    res.status(500).send();
  }catch(err){
    console.log(err);

    res.status(500).send();
  }
});

router.post("/folder/document/:folderId/:documentId", async(req, res)=>{
  try{
    var folderId = req.params.folderId;
    var documentId = req.params.documentId;
    if(!mongoose.Types.ObjectId.isValid(folderId)){
      return res.status(500).send();
    }
    if(!mongoose.Types.ObjectId.isValid(documentId)){
      return res.status(500).send();
    }
    var document = await Document.findById(documentId);
    var newParentFolder = await Folder.findById(folderId);
    if(document.parent_folder && document.parent_folder.equals(folderId) && newParentFolder.document.indexOf(documentId)>=-1){
      return res.status(200).send("ok");
    }
    else if(document.parent_folder){
      var parentFolder = await Folder.findById(document.parent_folder);
      if(parentFolder){
        var index = parentFolder.document.indexOf(document._id);
        if(index>-1){
          parentFolder.document.splice(index,1);
          await parentFolder.save();
        }
      }
    }
    if(newParentFolder){

      newParentFolder.document.push(document);
      await newParentFolder.save();
      document.parent_folder = newParentFolder;
      await document.save();
      res.status(200).send();
    }
    else{
      return res.status(500).send();
    }

  }catch(err){
    console.log(err);
    res.status(500).send();
  }
});

//post multiple docs into folder
router.post("/folder/:folderId/document", async(req, res)=>{
  try{
    var folderId = req.params.folderId;
    var documentIds = req.body.documents || [];
    console.log(documentIds)
    if(!mongoose.Types.ObjectId.isValid(folderId)){
      return res.status(500).send();
    }

    for(let documentId of documentIds){
      if(!mongoose.Types.ObjectId.isValid(documentId)){
        return res.status(500).send();
      }
      var document = await Document.findById(documentId);
      var newParentFolder = await Folder.findById(folderId);
      if(document.parent_folder && document.parent_folder.equals(folderId) && newParentFolder.document.indexOf(documentId)>=-1){
        continue
      }
      else if(document.parent_folder){
        var parentFolder = await Folder.findById(document.parent_folder);
        if(parentFolder){
          var index = parentFolder.document.indexOf(document._id);
          if(index>-1){
            parentFolder.document.splice(index,1);
            await parentFolder.save();
          }
        }
      }
      if(newParentFolder){

        newParentFolder.document.push(document);
        await newParentFolder.save();
        document.parent_folder = newParentFolder;
        await document.save();

      }
      else{
        return res.status(500).send();
      }
    }
    res.status(200).send("ok");


  }catch(err){
    console.log(err);
    res.status(500).send();
  }
});

module.exports = router;
