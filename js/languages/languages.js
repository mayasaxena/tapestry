const Languages = {
  hindi: "hindi",
  marathi: "marathi",
  english: "english"
}

function getMetadata(source, language) {
  switch (language) {
    case Languages.hindi: 
    case Languages.marathi: 
    case Languages.english: 
      return { [Metadata.reference_age]: [source.birthDate] }
  }
}

// The languages we have words for that both people list, the chosen language first. English only shows when
// they share nothing else, unless it's the chosen language.
function sharedLanguages(person, other, language) {
  const speaks = p => (p?.languages ?? []).map(spoken => spoken.toLowerCase())
  const shared = Object.values(Languages)
    .sort((a, b) => (b == language) - (a == language))
    .filter(known => speaks(person).includes(known) && speaks(other).includes(known))
  return language == Languages.english ? shared : shared.filter(known => known != Languages.english || shared.length == 1)
}
