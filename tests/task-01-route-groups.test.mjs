import test from "node:test"
import assert from "node:assert/strict"
import { existsSync } from "node:fs"
import { join } from "node:path"

const rootDir = process.cwd()

function hasPath(relativePath) {
  return existsSync(join(rootDir, relativePath))
}

test("Task 01 route groups and navigation entry points exist", () => {
  assert.equal(hasPath("app/(marketing)/page.tsx"), true)
  assert.equal(hasPath("app/(auth)/login/page.tsx"), true)
  assert.equal(hasPath("app/(citizen)/concerns/page.tsx"), true)
})
