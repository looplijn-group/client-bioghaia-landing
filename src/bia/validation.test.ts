import { describe, expect, it } from "vitest"
import { getValidationReport } from "./validation"

describe("Bia validation", () => {
  it("does not report locale or graph issues for English", () => {
    expect(getValidationReport("en")).toEqual([])
  })

  it("does not report locale or graph issues for Portuguese", () => {
    expect(getValidationReport("pt")).toEqual([])
  })
})
