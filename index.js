const TurndownService = require('turndown');
const { JSDOM } = require("jsdom");
const fs = require('fs');
const fsPromises = fs.promises;
const minimist = require('minimist');

const argv = minimist(process.argv.slice(2));
const inputPath = argv.input
const outputPath = argv.output
const eleventyTagName = argv.tagName
const layoutPath = argv.layout

const turndownService = new TurndownService({
  bulletListMarker: '-',
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
})

const converter = async (input, output) => {
  try {
    await fsPromises.access(output, fs.constants.W_OK) 
  } catch (err) {
    if (err.code === 'ENOENT') {
      await fsPromises.mkdir(output)
    } else {
      throw err;
    }
  }
  try {
    const dirents = await fsPromises.readdir(input, { withFileTypes: true })
    dirents.forEach(async ({ name }) => {
      const fileType = name.split('.')[1]
      if (fileType !== 'html') return
      try {
        const htmlString = await fsPromises.readFile(`${input}/${name}`, 'utf-8')

        // Extract contents from HTML
        const document = new JSDOM(htmlString).window.document
        const title = document.querySelector('title').textContent
        const date = document.querySelector('.dt-published').dateTime

        const convertTag = (before, after) => {
          const beforeList = document.querySelectorAll(before);
          beforeList.forEach(b => {
            const a = document.createElement(after);
            a.innerHTML = b.innerHTML;
            b.parentNode.insertBefore(a, b);
            b.parentNode.removeChild(b);
          })
        }

        // Remove title
        document.querySelector('.graf--title').innerHTML = '';

        // Convert H3 tag to H2
        convertTag('h3', 'h2');

        // Convert H4 tag to H3
        convertTag('h4', 'h3');

        // Shape pre code
        const preList = document.querySelectorAll('.graf--pre');
        preList.forEach(pre => {
          const code = document.createElement('code');
          code.innerHTML = pre.innerHTML;
          code.querySelectorAll('br').forEach(br => {
            br.insertAdjacentText('afterend', '\n')
          })
          pre.innerHTML = '';
          pre.insertAdjacentHTML('beforeend', code.outerHTML);
        })

        // Embed
        const figure = document.querySelectorAll('.graf--figure');
        figure.forEach(g => {
          const child = g.childNodes[0];
          const tagName = child.tagName;
          const className = child.className;
          if (tagName === "SCRIPT" || tagName === "IFRAME") {
            const url = g.childNodes[0].src.replace('.js', '');
            const a = document.createElement('a');
            a.href = url;
            a.text = url;
            g.previousElementSibling.insertAdjacentHTML('afterend', a.outerHTML);
          } else if (className === 'twitter-tweet') {
            const url = child.querySelector('a').href;
            const a = document.createElement('a');
            a.href = url;
            a.text = url;
            g.previousElementSibling.insertAdjacentHTML('afterend', a.outerHTML);
          }
        })

        // Twitter
        const twitterCards = document.querySelectorAll('.twitter-tweet');
        twitterCards.forEach(t => {
          const link = t.querySelectorAll('a');
        })

        const content = document.querySelector('.section-content').outerHTML

        // Shape markdown content
        const markdown = turndownService.turndown(content)
        
        const info = `---
title: ${title}
date: ${date}
tags:
  - ${!eleventyTagName ? 'blog' : eleventyTagName}
layout: ${!layoutPath ? 'layouts/blog.njk' : layoutPath}
---

[[toc]]

`

        const eleventy = info + markdown

        // Create .md
        await fsPromises.writeFile(`${output}/${name.split('.')[0]}.md`, eleventy);

        console.log(`${name.split('.')[0]}`);
      } catch (err) {
        if (err) throw err;
      }
    })
  } catch (err) {
    if (err) throw err;
  }
}

converter(inputPath, outputPath)