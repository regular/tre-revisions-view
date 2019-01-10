const {client} = require('tre-client')
const History = require('.')
const h = require('mutant/html-element')
const setStyles = require('module-styles')("tre-revisions-view-demo")

setStyles(`
  .tre-revisions-view {
    max-width: 300px;
  }
`)

client( (err, ssb, config) => {
  if (err) return console.error(err)
  const renderHistory = History(ssb, {
    renderItem: kv => h('.revision', {
      id: 'key_' + kv.key.substr(1)
    }, [
      h('span', kv.key.substr(0, 5)),
      h('button', {
        'ev-click': e => {
          console.log(kv)
          ssb.publish({
            revisionRoot: kv.value.content.revisionRoot || kv.key,
            revisionBranch: kv.key,
            type: 'thing'
          }, err=>{
            if (err) console.error(err.message)
          })
        } 
      }, 'branch')
    ])
  })
  document.body.appendChild(h('div',
    renderHistory(
      config.tre.branches.root
    )
  ))
}) 
