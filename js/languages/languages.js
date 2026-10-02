const Languages = {
  hindi: "hindi",
  marathi: "marathi",
  english: "english"
}

function getMetadata(source) {
  return { [Metadata.reference_age]: [source.birthDate] }
}

// The languages to describe someone in: the chosen one for everyone, or with none chosen, the ones we have
// words for that both people list (English only when they share nothing else)
function tooltipLanguages(person, other, chosen) {
  if (chosen) {
    return [chosen]
  }
  const speaks = p => (p?.languages ?? []).map(spoken => spoken.toLowerCase())
  const shared = Object.values(Languages).filter(known => speaks(person).includes(known) && speaks(other).includes(known))
  return shared.filter(known => known != Languages.english || shared.length == 1)
}
