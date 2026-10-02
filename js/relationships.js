const definitions = {
  [Languages.hindi]: hindi_def,
  [Languages.marathi]: marathi_def,
  [Languages.english]: english_def
}

const fallbacks = {
  [Languages.hindi]: hindiDescribe,
  [Languages.marathi]: marathiDescribe,
  [Languages.english]: englishDescribe
}

const addresses = {
  [Languages.hindi]: hindi_address,
  [Languages.marathi]: marathi_address,
  [Languages.english]: english_address
}

const siblingRelations = {
  son: 'brother',
  daughter: 'sister',
  child: 'sibling'
}

// Every language words the same relationships, walking the Hindi graph since it makes the most distinctions
function getRelationships(dataByID, adjList, startID) {
  var nodes = {}
  var marked = {}

  // Breadth-first, so everyone is labelled through their closest connection to the selected person
  var queue = []
  queue.push(startID)
  const startData = dataByID[startID]
  const startMetadata = getMetadata(startData)

  nodes[startID] = {
    id: startID,
    path: "your",
    path_last: "your",
    key: "your",
    gen_gap: 0,
    metadata: startMetadata,
    titled_id: startID
  }

  marked[startID] = true

  while (queue.length > 0) {
    var sourceID = queue.shift()
    const source = nodes[sourceID]

    adjList[sourceID].forEach(destID => {
      if (!marked[destID]) {
        queue.push(destID)
        nodes[destID] = getNextNode(source, destID, dataByID, Object.keys(startMetadata), hindi_relations_graph)
        marked[destID] = true
      }
    });
  }
  return nodes
}

function getNextNode(fromNode, toID, dataByID, actions, relationsGraph) {
  const from = dataByID[fromNode.id]
  const to = dataByID[toID]
  const step = getStep(from, toID, to)

  var metadataKeys = []
  var metadata = {}
  actions.forEach(action => {
    const metadataResult = metadataActions[action](fromNode, to, step)
    if (metadataResult.key) {
      metadataKeys.push(metadataResult.key)
    }

    if (metadataResult.metadata) {
      metadata[action] = metadataResult.metadata
    }
  })

  // Once a step has no word, everyone past it is described from the last person who had one
  var key = fromNode.fallback ? null : relationsGraph[fromNode.key]?.[step.relation]

  var index = 0
  while (isObject(key) && index < metadataKeys.length) {
    key = key[metadataKeys[index]]
    index += 1
  }
  if (isObject(key)) {
    key = null
  }

  // Without a word, describe the step from the last person who has one, calling a parent's child a sibling
  // (bahu's brother rather than samdhi's son)
  var anchor = fromNode
  var relation = step.relation
  if (key == null && step.gen_gap == 1 && fromNode.previous && fromNode.gen_gap - fromNode.previous.gen_gap == -1) {
    anchor = fromNode.previous
    relation = siblingRelations[step.relation]
  }

  const nextNode = {
    id: toID,
    path: fromNode.path + '-' + step.relation,
    path_last: step.relation,
    key: key ?? anchor.key,
    fallback: key == null ? (anchor.fallback ?? []).concat(relation) : null,
    gen_gap: fromNode.gen_gap + step.gen_gap,
    metadata: metadata,
    previous: fromNode,
    // whoever the label's title belongs to
    titled_id: key == null ? anchor.titled_id : toID
  }

  return nextNode
}

// e.g. "bahu ka bhai" when the language has no word for the relationship
function relationshipLabel(relationship, language) {
  const words = relationship.key == "your" && relationship.fallback ? [] : [definitions[language][relationship.key]]
  const describe = fallbacks[language]
  if (!describe) {
    return words.concat(relationship.fallback ?? []).join("'s ")
  }
  return describe(words[0], relationship.fallback ?? [])
}

// What to call someone: younger people by name, and elders by their title, a same-sex sibling's title
// (bhabhi's sister is bhabhi too) or a title for their generation, with an honorific for much older people
function addressLabel(relationship, dataByID, language) {
  const address = addresses[language]
  if (!address || !relationship.previous) {
    return null
  }

  var path = [relationship]
  while (path[0].previous) {
    path.unshift(path[0].previous)
  }
  const you = dataByID[path[0].id]
  const person = dataByID[relationship.id]
  const firstName = (person.name ?? '').split(' ')[0]
  const generation = relationship.gen_gap

  if (generation > 0 || (generation == 0 && (address.peersByName || !isOlder(person, you)))) {
    return firstName
  }

  // The parent you're related through, or your older parent for in-laws
  const parent = path[1].gen_gap == -1
    ? dataByID[path[1].id]
    : you.parents.map(id => dataByID[id]).filter(p => p?.birthDate).sort((a, b) => a.birthDate < b.birthDate ? -1 : 1)[0]
  const olderThanParent = parent ? isOlder(person, parent) : true

  const siblingOfTitled = relationship.fallback?.length == 1
    && Object.values(siblingRelations).includes(relationship.fallback[0])
    && dataByID[relationship.titled_id]?.gender == person.gender
  var title
  if (!relationship.fallback || siblingOfTitled) {
    title = relationship.key in address.instead ? address.instead[relationship.key] : definitions[language][relationship.key]
  } else {
    var generic = address.generic[Math.max(generation, -3)]
    if (generic?.older) {
      generic = olderThanParent ? generic.older : generic.younger
    }
    title = generic?.[person.gender]
  }
  if (!title) {
    return firstName
  }

  const yearsOlder = (new Date(you.birthDate) - new Date(person.birthDate)) / (365.25 * 24 * 60 * 60 * 1000)
  const honorific = generation == 0 ? yearsOlder > 20 : olderThanParent
  if (honorific && address.honorific && !title.endsWith(` ${address.honorific}`)) {
    title = `${title} ${address.honorific}`
  }
  return address.named ? address.named(title, firstName) : title
}

function isOlder(person, than) {
  return Boolean(person?.birthDate && than?.birthDate && person.birthDate < than.birthDate)
}

function getStep(from, toID, to) {
  var relation
  var genGap

  if (from.parents.includes(toID)) {
    genGap = -1
    if (to.gender == 'Male') {
      relation = 'father'
    } else if (to.gender == 'Female') {
      relation = 'mother'
    } else {
      relation = 'parent'
    }
  } else if (from.children.includes(toID)) {
    genGap = 1
    if (to.gender == 'Male') {
      relation = 'son'
    } else if (to.gender == 'Female') {
      relation = 'daughter'
    } else {
      relation = 'child'
    }
  } else if (from.partners.includes(toID)) {
    genGap = 0
    if (to.gender == 'Male') {
      relation = 'husband'
    } else if (to.gender == 'Female') {
      relation = 'wife'
    } else {
      relation = 'spouse'
    }
  } else {
    genGap = null
    relation = '?'
  }

  return { gen_gap: genGap, relation: relation }
}

function isObject(value) {
  return typeof value === 'object' && value !== null
}
