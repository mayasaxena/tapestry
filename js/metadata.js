const Metadata = {
  reference_age: 'reference_age'
}

const metadataActions = {
  // (fromNode, to, step) -> {metadata: , key: }
  [Metadata.reference_age]: referenceAge
}

function referenceAge(fromNode, to, step) {
  // The top of the stack is the person the path is at; below it is whoever the path climbed up from at each
  // generation, so stepping down to a child compares them with the sibling the path went up through
  var ageRefStack = fromNode.metadata[Metadata.reference_age].slice()
  var ageDiff = null
  if (step.gen_gap == 0) {
    ageRefStack.pop()
    ageRefStack.push(to.birthDate)
  } else if (step.gen_gap == 1) {
    ageRefStack.pop()
    ageDiff =
      ageRefStack[ageRefStack.length - 1] > to.birthDate ? 'older' : 'younger'
    ageRefStack.pop()
    ageRefStack.push(to.birthDate)
  } else if (step.gen_gap == -1) {
    ageRefStack.push(to.birthDate)
  }

  return {
    metadata: ageRefStack,
    key: ageDiff
  }
}
