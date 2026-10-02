const Languages = {
  hindi: "hindi",
  marathi: "marathi"
}

function getMetadata(source, language) {
  switch (language) {
    case Languages.hindi: 
    case Languages.marathi: 
      return { [Metadata.reference_age]: [source.birthDate] }
  }
}

// The languages we have words for that both people list, the chosen language first
function sharedLanguages(person, other, language) {
  const speaks = p => (p?.languages ?? []).map(spoken => spoken.toLowerCase())
  return Object.values(Languages)
    .sort((a, b) => (b == language) - (a == language))
    .filter(known => speaks(person).includes(known) && speaks(other).includes(known))
}
