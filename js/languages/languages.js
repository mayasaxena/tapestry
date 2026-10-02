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