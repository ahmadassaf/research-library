const fs = require('fs').promises
const path = require('path')

async function walk(dir, fileList = []) {

    if ((!dir.toLowerCase().includes('tutorial') && !dir.startsWith('.') )|| dir === './') {
        console.log(`### ${dir}`)
        const files = await fs.readdir(dir)
        for (const file of files) {
          const stat = await fs.stat(path.join(dir, file))
          if (stat.isDirectory()) fileList = await walk(path.join(dir, file), fileList)
          else {
              if (file.endsWith('.epub')) console.log(` - ${file.replace('.epub', '')} [[epub]](https://github.com/ahmadassaf/research-library/blob/master/${path.join(dir, file).replace(/\s/g   , '%20')})`)
              else if (file.endsWith('.pdf')) console.log(` - ${file.replace('.pdf', '')} [[pdf]](https://github.com/ahmadassaf/research-library/blob/master/${path.join(dir, file).replace(/\s/g   , '%20')})`)
            }
        }
    }
  return fileList
}

walk('./');