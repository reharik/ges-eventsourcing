
module.exports = function(R, uuid, functionalHelpers) {
  let fh = functionalHelpers;
  let parseMetadata = R.compose(R.chain(fh.safeParseBuffer), R.chain(fh.safeProp('metadata')), fh.safeProp('event'));
  let parseData = R.compose(R.chain(fh.safeParseBuffer), R.chain(fh.safeProp('data')), fh.safeProp('event'));

  return {
    parseMetadata,
    parseData
  };
};
