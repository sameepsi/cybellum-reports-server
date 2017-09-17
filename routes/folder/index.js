var express = require("express");
var router = express.Router({mergeParams:true});
var mongoose = require("mongoose");

var {Document} = require("../../models/document");
var {Folder} = require("../../models/folder");
var folderNames = require("./Constants");
/**API to get all folders in the System GET /folder
*
*/
router.get("/folder", async(req, res)=>{
  try{
    var folders = await Folder.find({});
    var responseObject = {};
    folders.forEach((folder)=>{
      responseObject[folder._id]=folder;
    });
    var documentsWithoutFolders = await Document.count({
      parent_folder: { $exists: false }
    });
    var obj = {
      _id:"0",
      child:[],
      document:new Array(documentsWithoutFolders),
      name:"Default"
    }
    responseObject['0']=obj;
    res.status(200).send(responseObject);
  }catch(err){
    res.status(500).send();
  }
});

/*
GET /folder/new- This will send new folder structure as per latest discussion
Not removing previous structure as of now.
*/
router.get("/folder/new", async(req, res) => {
  try{
    var documents = await Document.aggregate({$match: {vulnerability_type: {
      $gte:0
    }}},{
      $group:{
        _id:"$vulnerability_type",
        total:{$sum:1}

      }
    });
    var folders = {};
    for(var i=0;i<=6;i++){
      var parent=undefined;
      if(i===0 ||i===1 ||i===2 ||i===3){
        parent=-1;
      }
      else if(i===4 || i===5){
        parent=-2;
      }
      folders[i]={
        _id:i,
        name:folderNames[i],
        count:0,
        parent,
        child:[]
      }
    }
    documents.forEach((document)=>{
      folders[document._id].count = document.total;
    });
    folders['-1']={
      _id:-1,
      name:"Heap vulnerabilities",
      count:0,
      child:[0,1,2,3]
    }
    folders['-2']={
      _id:-2,
      name:"Stack vulnerabilities",
      count:0,
      child:[4,5]
    }
    res.send(folders);
  }catch(err){
    console.log(err);
    res.status(500).send();
  }
});

/**API to get specific folder in the System GET /folder
*
*/
router.get("/folder/:id", async(req, res)=>{
  try{
    var id = req.params.id;
    console.log("gett")
    if(!id || !mongoose.Types.ObjectId.isValid(id)){
      return res.status(500).send();
    }
    var folder = await Folder.findById(id);
    if(!folder){
      return res.status(500).send();
    }
    res.status(200).send(folder);
  }catch(err){
    res.status(500).send();
  }
});

/**API to add new folder in the System POST /folder
*@param name- required
@param parent- id of parent- optional
*/
router.post("/folder", async(req, res)=>{
  try{
    var name = req.body.name;
    var parent = req.body.parent;
    if(parent && !mongoose.Types.ObjectId.isValid(parent))
    {
      return res.status(500).send();
    }
    if(!name){
      return res.status(500).send();
    }
    var folder = new Folder();
    folder.name = name;
    folder.parent = parent;
    await folder.save();

    if(parent){
      var parentFolder= await Folder.findById(parent);
      if(parentFolder){
        parentFolder.child.push(folder);
        await parentFolder.save();
      }
      else{
        await folder.remove();
        return res.status(500).send();
      }

    }

    res.status(200).send(folder);
  }catch(e){
    console.log(e);
    res.status(500).send();
  }
});
const checkIfValidMongoObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
}
const checkIfMovePossible = async(folderToBeMovedId, newParentId) => {
  try{
    var newParent = await Folder.findById(newParentId);
    console.log(newParent);
    console.log(folderToBeMovedId);
    if(newParent.parent && newParent.parent.equals(folderToBeMovedId)){
      return false;
    }
    else if(!newParent.parent){
      return true;
    }
    else{
      checkIfMovePossible(folderToBeMovedId, newParent.parent)
    }
  }catch(err){
    throw err;
  }
}
router.put("/folder/:id", async(req, res) => {
  try{
    var name = req.body.name;
    var parent = req.body.parent;
    var folderId = req.params.id;
    if((!name && !parent) || !checkIfValidMongoObjectId(folderId)){
      return res.status(500).send();
    }

    var folder = await Folder.findById(folderId);
    var updateObject = {};
    if(folder){
      if(parent){
        if(fodlerId===parent){
          return res.status(500).send();
        }
        var bool = await checkIfMovePossible(folderId, parent)
        if(bool===false){
          return res.status(500).send();
        }
        if(folder.parent){
          var parentFolder = await Folder.findById(folder.parent);
          if(parentFolder){
            var index = parentFolder.child.indexOf(folderId);
            if(index>-1){
              parentFolder.child.splice(index, 1);
              await parentFolder.save();
            }
          }

        }
        var newParent = await Folder.findById(parent);
        if(newParent){
          newParent.child.push(folder);
          newParent.save();
          folder.parent = parent;
        }
      }


      if(name){
        folder.name = name;
      }
      await folder.save();
      return res.status(200).send(folder);

    }
    res.status(500).send();
  }catch(err){
    console.log(err);
    res.status(500).send();
  }
});

/**API to delete specific folder in the System DELETE /folder
*it will recursively delete all folders in that folder and then delete that folder
*/
router.delete("/folder/:id", async(req, res)=>{
  var parentId;
  var id = req.params.id;
  console.log("here");
  try{
    if(!id || !mongoose.Types.ObjectId.isValid(id)){
      return res.status(500).send();
    }
    var folder  = await Folder.findById(id);
    parent = folder.parent;
    if(parent){
      var parentFolder = await Folder.findById(parent);
      if(parentFolder){
        var index = parentFolder.child.indexOf(id);
        if(index>-1){
          parentFolder.child.splice(index,1);
          await parentFolder.save();
        }
      }
    }
    await recursivelyDeleteFolder(id);
    res.status(200).send("ok");
  }
  catch(e){
    console.log(e);
    if(parent){
      var parentFolder = await Folder.findById(parent);
      if(parentFolder && parentFolder.child.indexOf(id)===-1){
        parentFolder.child.push(id);
      }
    }
    res.status(500).send();
  }
});

const recursivelyDeleteFolder = async(id) =>{
  var folder ;

  try{
    folder  = await Folder.findById(id);
    if(!folder){
      throw new Error(`Folder with id ${id} not found`);
    }
    for(let childId of folder.child){
      await recursivelyDeleteFolder(childId);
    }
    var documents = folder.document;
    while(documents.length>0){
      await removeFolderRefFromDoc(documents[0]);
      var index = folder.document.indexOf(documents[0]);
      if(index>-1){
        folder.document.splice(index, 1);
        await folder.save();
      }
    }
    await folder.remove();
    return;
  }
  catch(e){
    if(folder){
      await folder.save();
    }
    throw e;
  }
};


const removeFolderRefFromDoc = async(doc) => {
  try{
    var document = await Document.findById(doc);
    if(document){
      document.parent_folder = undefined;
      await document.save();
    }

  }catch(err){
    console.log(err);
    throw err;
  }
}
module.exports = router;
