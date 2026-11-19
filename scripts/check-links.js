#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { load } from 'js-yaml'

const CONFIG_DIR = 'configurations'
let urlsFile = null

// Parse arguments
const args = process.argv.slice(2)
args.forEach((arg) => {
  if (arg.startsWith('--urls-file=')) {
    urlsFile = arg.split('=')[1]
  }
})

/**
 * Recursively finds all .json, .yaml, and .yml files in a directory.
 */
function findFiles(dir) {
  let results = []
  if (!fs.existsSync(dir)) return results
  const list = fs.readdirSync(dir)
  list.forEach((file) => {
    const fullPath = path.join(dir, file)
    const stat = fs.statSync(fullPath)
    if (stat && stat.isDirectory()) {
      results = results.concat(findFiles(fullPath))
    } else if (
      file.endsWith('.json') ||
      file.endsWith('.yaml') ||
      file.endsWith('.yml')
    ) {
      results.push(fullPath)
    }
  })
  return results
}

const foundLinks = []

/**
 * Recursively extracts links from an object.
 * Links are identified as:
 * 1. Strings containing HTML <a> tags.
 * 2. Objects with 'text' and 'href' string properties.
 */
function extractLinks(obj, filePath, lineTracker) {
  if (typeof obj === 'string') {
    const regex = /<a[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/g
    let match
    while ((match = regex.exec(obj)) !== null) {
      const tagMatch = match[0]
      const index = lineTracker.content.indexOf(tagMatch, lineTracker.lastIndex)
      let line = -1
      if (index !== -1) {
        line = lineTracker.content.substring(0, index).split('\n').length
        lineTracker.lastIndex = index + tagMatch.length
      }

      foundLinks.push({
        url: match[1],
        text: (() => {
          let sanitized = match[2]
          let previous
          do {
            previous = sanitized
            sanitized = sanitized.replace(/<[^>]*>/g, '')
          } while (sanitized !== previous)
          return sanitized.trim()
        })(),
        file: filePath,
        line
      })
    }
  } else if (Array.isArray(obj)) {
    obj.forEach((item) => extractLinks(item, filePath, lineTracker))
  } else if (typeof obj === 'object' && obj !== null) {
    if (
      obj.href &&
      obj.text &&
      typeof obj.href === 'string' &&
      typeof obj.text === 'string'
    ) {
      const index = lineTracker.content.indexOf(obj.href, lineTracker.lastIndex)
      let line = -1
      if (index !== -1) {
        line = lineTracker.content.substring(0, index).split('\n').length
        lineTracker.lastIndex = index + obj.href.length
      }

      foundLinks.push({
        url: obj.href,
        text: obj.text.trim(),
        file: filePath,
        line
      })
    }
    for (const key in obj) {
      extractLinks(obj[key], filePath, lineTracker)
    }
  }
}

console.log(`Searching for configuration files in ${CONFIG_DIR}...`)
const files = findFiles(CONFIG_DIR)
console.log(`Found ${files.length} files.`)

files.forEach((file) => {
  try {
    const content = fs.readFileSync(file, 'utf8')
    const data = file.endsWith('.json') ? JSON.parse(content) : load(content)
    const lineTracker = { content, lastIndex: 0 }
    extractLinks(data, file, lineTracker)
  } catch (e) {
    console.error(`Error parsing ${file}: ${e.message}`)
  }
})

console.log(`Extracted ${foundLinks.length} links.`)

// 1. Check for same text, different URLs (Report only)
const textToLinks = {}
foundLinks.forEach((link) => {
  if (!textToLinks[link.text]) {
    textToLinks[link.text] = []
  }
  textToLinks[link.text].push(link)
})

let internalWarnings = 0
for (const text in textToLinks) {
  const links = textToLinks[text]
  const urls = new Set(links.map((l) => l.url))
  if (urls.size > 1) {
    console.warn(`[WARNING] Text "${text}" is used with different URLs:`)
    links.forEach((link) => {
      console.warn(`  - ${link.url} (at ${link.file}:${link.line})`)
    })
    internalWarnings++
  }
}

if (internalWarnings > 0) {
  console.warn(
    `Found ${internalWarnings} internal link text inconsistencies (Reporting only).`
  )
} else {
  console.log('No internal link text inconsistencies found.')
}

// 2. Check against URLs file (Fail if mismatched)
let hasExternalInconsistency = false
if (urlsFile) {
  console.log(`Checking against URLs file: ${urlsFile}`)
  if (!fs.existsSync(urlsFile)) {
    console.error(`URLs file not found: ${urlsFile}`)
    process.exit(1)
  }

  let masterUrls = []
  try {
    const content = fs.readFileSync(urlsFile, 'utf8')
    masterUrls = JSON.parse(content)
  } catch (e) {
    console.error(`Error parsing URLs file: ${e.message}`)
    process.exit(1)
  }

  foundLinks.forEach((link) => {
    masterUrls.forEach((master) => {
      const textMatch = link.text === master.text
      const urlMatch = link.url === master.url

      if ((textMatch && !urlMatch) || (!textMatch && urlMatch)) {
        console.error(`[FAILURE] Link mismatch in ${link.file}:${link.line}:`)
        console.error(`  Found:    text: "${link.text}", url: "${link.url}"`)
        console.error(
          `  Expected: text: "${master.text}", url: "${master.url}"`
        )
        hasExternalInconsistency = true
      }
    })
  })
}

if (hasExternalInconsistency) {
  console.error('Link validation failed against master URLs file.')
  process.exit(1)
}

console.log('Link validation completed successfully.')
