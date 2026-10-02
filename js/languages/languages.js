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

// Use Marathi words for people who speak it
function termsLanguage(person, language) {
  return (person.languages ?? []).some(spoken => spoken.toLowerCase() == Languages.marathi) ? Languages.marathi : language
}
