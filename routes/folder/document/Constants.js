
const editableFields = ["original_path", "stacktrace", "custom_fields"];

const customFields = [{
  name:"comments",
  type:"Array"
},{
  name:"remarks",
  type:"String"
},
{
  name:"attachment",
  type:"File"
}]

const getEditableFields = () => {
  return editableFields;
};

const getCustomFields = () => {
    return customFields;
};

module.exports = {
  getEditableFields,
  getCustomFields
}
