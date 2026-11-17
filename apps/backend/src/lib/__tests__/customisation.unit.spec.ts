import {
  checkCustomisation,
  countCharacters,
  DEFAULT_LABEL,
  DEFAULT_MAX_LENGTH,
  MESSAGE_PREFIX,
  readCustomisationSettings,
  readLineCustomisation,
} from "../customisation"

const plate = {
  customisation_enabled: true,
  customisation_label: "Number plate",
  customisation_max_length: 8,
}

describe("readCustomisationSettings", () => {
  it("returns null unless the product has it switched on", () => {
    expect(readCustomisationSettings(null)).toBeNull()
    expect(readCustomisationSettings({})).toBeNull()
    expect(readCustomisationSettings({ ...plate, customisation_enabled: false })).toBeNull()
    expect(readCustomisationSettings({ ...plate, customisation_enabled: "false" })).toBeNull()
  })

  it("reads the label and the limit", () => {
    expect(readCustomisationSettings(plate)).toEqual({ label: "Number plate", maxLength: 8 })
  })

  it("accepts the text values Medusa's metadata editor saves", () => {
    expect(
      readCustomisationSettings({
        customisation_enabled: "true",
        customisation_label: "  Name ",
        customisation_max_length: "12",
      })
    ).toEqual({ label: "Name", maxLength: 12 })
  })

  it("falls back to defaults when the label or limit is missing or not usable", () => {
    const fallback = { label: DEFAULT_LABEL, maxLength: DEFAULT_MAX_LENGTH }
    expect(readCustomisationSettings({ customisation_enabled: true })).toEqual(fallback)
    for (const limit of [0, -3, 2.5, 201, "lots", null]) {
      expect(
        readCustomisationSettings({
          customisation_enabled: true,
          customisation_label: "",
          customisation_max_length: limit,
        })
      ).toEqual(fallback)
    }
  })
})

describe("readLineCustomisation", () => {
  it("returns the buyer's text with its label", () => {
    expect(
      readLineCustomisation({ customisation: "AB12 CDE", customisation_label: "Number plate" })
    ).toEqual({ label: "Number plate", text: "AB12 CDE" })
  })

  it("uses the default label when none was stored", () => {
    expect(readLineCustomisation({ customisation: "Sam" })).toEqual({ label: DEFAULT_LABEL, text: "Sam" })
  })

  it("returns null when there is no text", () => {
    expect(readLineCustomisation(null)).toBeNull()
    expect(readLineCustomisation({ customisation: "   " })).toBeNull()
    expect(readLineCustomisation({ customisation: 42 })).toBeNull()
  })
})

describe("checkCustomisation", () => {
  it("passes a line with no text on a product that takes none", () => {
    expect(checkCustomisation({}, {})).toBeNull()
    expect(checkCustomisation(null, null)).toBeNull()
  })

  it("rejects text on a product that takes none", () => {
    expect(checkCustomisation({}, { customisation: "hello" }, "Infinity Cube")).toBe(
      `${MESSAGE_PREFIX}Infinity Cube cannot be personalised.`
    )
  })

  it("asks for the text when the product needs it", () => {
    const message = `${MESSAGE_PREFIX}Please fill in "Number plate" for Keychain.`
    expect(checkCustomisation(plate, {}, "Keychain")).toBe(message)
    expect(checkCustomisation(plate, null, "Keychain")).toBe(message)
    expect(checkCustomisation(plate, { customisation: "   " }, "Keychain")).toBe(message)
    expect(checkCustomisation(plate, { customisation: 12345 }, "Keychain")).toBe(message)
  })

  it("accepts text up to the limit and rejects one character more", () => {
    expect(checkCustomisation(plate, { customisation: "AB12 CDE" })).toBeNull()
    expect(checkCustomisation(plate, { customisation: "AB12 CDEF" })).toBe(
      `${MESSAGE_PREFIX}"Number plate" can be 8 characters at most.`
    )
  })

  it("counts an emoji as one character", () => {
    expect(countCharacters("AB😀")).toBe(3)
    expect(checkCustomisation({ ...plate, customisation_max_length: 3 }, { customisation: "AB😀" })).toBeNull()
  })

  it("rejects line breaks and other control characters", () => {
    expect(checkCustomisation(plate, { customisation: "AB\nCD" })).toBe(
      `${MESSAGE_PREFIX}"Number plate" must be one line of plain text.`
    )
  })

  it("only accepts the product's own label", () => {
    expect(
      checkCustomisation(plate, { customisation: "AB12", customisation_label: "Number plate" })
    ).toBeNull()
    expect(
      checkCustomisation(plate, { customisation: "AB12", customisation_label: "Something else" })
    ).toBe(`${MESSAGE_PREFIX}This item's options have changed. Please reload the page and try again.`)
  })
})
