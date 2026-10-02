// Marathi makes the same distinctions as Hindi or fewer (both sets of grandparents are ajoba and ajji),
// so it walks the Hindi relations graph and only needs its own words
const marathi_def = {
  "your" : "you",
  "mother" : "aai",
  "father" : "baba",
  "stepmother" : "saavatra aai",
  "stepfather" : "saavatra baba",
  "paternal_grandfather" : "ajoba",
  "paternal_grandmother" : "ajji",
  "maternal_grandfather" : "ajoba",
  "maternal_grandmother" : "ajji",
  "maternal_uncle_older" : "mama",
  "maternal_uncle_older_husband" : "mama",
  "maternal_uncle_older_wife" : "mami",
  "maternal_uncle_younger" : "mama",
  "maternal_uncle_younger_husband" : "mama",
  "maternal_uncle_younger_wife" : "mami",
  "maternal_aunt" : "maushi",
  "maternal_aunt_wife" : "maushi",
  "maternal_aunt_husband" : "mama",
  "paternal_uncle_older" : "kaka",
  "paternal_uncle_older_husband" : "kaka",
  "paternal_uncle_older_wife" : "kaku",
  "paternal_uncle_younger" : "kaka",
  "paternal_uncle_younger_husband" : "kaka",
  "paternal_uncle_younger_wife" : "kaku",
  "paternal_aunt" : "atya",
  "paternal_aunt_wife" : "atya",
  "paternal_aunt_husband" : "kaka",
  "sister_older" : "mothi bahin",
  "sister_older_wife" : "tai",
  "sister_older_husband" : "bhaoji",
  "sister_younger" : "dhakti bahin",
  "sister_younger_wife" : "bahin",
  "sister_younger_husband" : "mehuna",
  "sister_son" : "bhacha",
  "sister_son_husband" : "bhacha",
  "sister_daughter" : "bhachi",
  "sister_daughter_wife" : "bhachi",
  "sister_son_wife" : "bhachyachi baiko",
  "sister_daughter_husband" : "bhachicha navra",
  "brother_older" : "motha bhau",
  "brother_older_husband" : "dada",
  "brother_older_wife" : "vahini",
  "brother_younger" : "dhakta bhau",
  "brother_younger_husband" : "bhau",
  "brother_younger_wife" : "bhavjay",
  "brother_daughter" : "putni",
  "brother_daughter_wife" : "putni",
  "brother_son" : "putanya",
  "brother_son_husband" : "putanya",
  "brother_son_wife" : "putanyachi baiko",
  "brother_daughter_husband" : "putnicha navra",
  "husband" : "navra",
  "husband_brother_older" : "mothe dir",
  "husband_brother_older_husband" : "mothe dir",
  "husband_brother_older_wife" : "mothi jaau",
  "husband_sister" : "nanand",
  "husband_sister_wife" : "nanand",
  "husband_sister_husband" : "nanandecha navra",
  "husband_brother_younger" : "dir",
  "husband_brother_younger_husband" : "dir",
  "husband_brother_younger_wife" : "jaau",
  "wife" : "baiko",
  "wife_brother_older" : "mehuna",
  "wife_brother_older_husband" : "mehuna",
  "wife_brother_younger" : "mehuna",
  "wife_brother_younger_husband" : "mehuna",
  "wife_brother_wife" : "mehunyachi baiko",
  "wife_sister" : "mehuni",
  "wife_sister_wife" : "mehuni",
  "wife_sister_husband" : "sadu",
  "son" : "mulga",
  "daughter" : "mulgi",
  "daughter_daughter" : "nat",
  "daughter_daughter_wife" : "nat",
  "daughter_son" : "natu",
  "daughter_son_husband" : "natu",
  "son_daughter" : "nat",
  "son_daughter_wife" : "nat",
  "son_son" : "natu",
  "son_son_husband" : "natu",
  "son_son_wife" : "natsoon",
  "son_daughter_husband" : "natjavai",
  "daughter_son_wife" : "natsoon",
  "daughter_daughter_husband" : "natjavai",
  "son_line_great_grandson" : "panatu",
  "son_line_great_granddaughter" : "panti",
  "daughter_line_great_grandson" : "panatu",
  "daughter_line_great_granddaughter" : "panti",
  "child_wife" : "soon",
  "child_husband" : "javai",
  "wife_mother" : "saasu",
  "wife_father" : "sasre",
  "husband_mother" : "saasu",
  "husband_father" : "sasre",
  "child_spouse_father" : "vyahi",
  "child_spouse_mother" : "vihin",
  "paternal_greatgrandfather": "panjoba",
  "paternal_greatgrandmother": "panji",
  "maternal_greatgrandfather": "panjoba",
  "maternal_greatgrandmother": "panji",
}

// How to say a step there's no word for: the possessive joins onto the person before it, e.g. soon + brother
// = "soonecha bhau", agreeing with the word after it (cha, chi, che)
const marathi_fallback = {
  "father": { suffix: "che", word: "baba" },
  "mother": { suffix: "chi", word: "aai" },
  "parent": { suffix: "che", word: "aai/baba" },
  "husband": { suffix: "cha", word: "navra" },
  "wife": { suffix: "chi", word: "baiko" },
  "spouse": { suffix: "cha", word: "jodidar" },
  "son": { suffix: "cha", word: "mulga" },
  "daughter": { suffix: "chi", word: "mulgi" },
  "child": { suffix: "che", word: "mul" },
  "brother": { suffix: "cha", word: "bhau" },
  "sister": { suffix: "chi", word: "bahin" },
  "sibling": { suffix: "che", word: "bhavanda" },
}

// Words whose ending changes before a possessive, e.g. soon -> "soonecha"
const marathi_oblique = {
  "baba": "baban",
  "navra": "navrya",
  "mulga": "mula",
  "mulgi": "muli",
  "mul": "mula",
  "bhau": "bhava",
  "bahin": "bahini",
  "soon": "soone",
  "javai": "javaya",
  "nat": "nati",
  "natu": "natva",
  "panatu": "panatva",
  "bhacha": "bhachya",
  "mehuna": "mehunya",
  "nanand": "nanande",
  "jaau": "jaave",
  "dir": "dira",
  "sasre": "sasryan",
  "vyahi": "vyahyan",
  "vihin": "vihini",
  "bhavjay": "bhavjayi",
}

// Describe a path from the last person with a title, e.g. "sunechya bhavacha mulga"
function marathiDescribe(title, relations) {
  return relations.reduce((label, relation, index) => {
    const phrase = marathi_fallback[relation] ?? { suffix: '', word: relation }
    if (!label) {
      return phrase.word
    }
    const words = label.split(' ')
    const last = words.pop()
    // the possessive is "chya" when another step follows
    const suffix = index < relations.length - 1 ? 'chya' : phrase.suffix
    return words.concat((marathi_oblique[last] ?? last) + suffix, phrase.word).join(' ')
  }, title)
}

// What to call people to their face (see addressLabel). Marathi shows respect with tumhi rather than a suffix.
const marathi_address = {
  honorific: null,
  // Titles people aren't called by to their face: what to say instead, or null for their name
  instead: {
    "husband": null,
    "wife": null,
    "sister_older": "tai",
    "brother_older": "dada",
    "stepmother": "aai",
    "stepfather": "baba",
    "husband_brother_older_wife": "tai",
    "husband_sister_husband": "bhaoji"
  },
  // For elders without a title, by how many generations above you they are
  generic: {
    "0": { "Male": "dada", "Female": "tai" },
    "-1": { "Male": "kaka", "Female": "kaku" },
    "-2": { "Male": "ajoba", "Female": "ajji" },
    "-3": { "Male": "panjoba", "Female": "panji" }
  }
}
