/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2019 Looker Data Sciences, Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

import React, { useCallback, useContext } from 'react'
import { Button } from '@looker/components'
import { LookerEmbedSDK } from '@looker/embed-sdk'
import { ExtensionContext } from '@looker/extension-sdk-react'
import { EmbedContainer } from './EmbedContainer'

const EmbedExplore = ({ id }) => {
  const [qid, setQid] = React.useState('')
  const [qobject, setQobject] = React.useState({})
  const [latestDate, setLatestDate] = React.useState('Updating...')
  const [running, setRunning] = React.useState(true)
  const [explore, setExplore] = React.useState()

  const extensionContext = useContext(ExtensionContext)
  const sdk = extensionContext.core40SDK

  const updateQid = async (url) => {
    console.log('update with url:', url)
    const params = new URLSearchParams(url)
    const query = params.get('qid')
    console.log('query slug from url:', query)

    if (query) {
      const response = await sdk.ok(sdk.query_for_slug(query))
      console.log('query:', response)
      setQobject(response)
      setQid(query)
    }
  }

  const updateRunButton = (running) => {
    setRunning(running)
  }

  const setupExplore = (explore) => {
    getLatest()
    setExplore(explore)
  }

  const runExplore = () => {
    if (explore) {
      explore.run()
    }
  }

  const setDateFilter = (filterValue) => {
    if (explore) {
      explore.updateFilters({
        "order_items.created_date": filterValue
      })
    }
  }

  const getLatest = async () => {
    try {
      const queryResults = await sdk.ok(
        sdk.run_inline_query({
          body: {
            "model": "ecomm",
            "view": "order_items",
            "fields": ["order_items.created_date"],
            "sorts": ["order_items.created_date desc"],
            "limit": 1,
          }, 
          result_format: 'json'
        })
      )
      const latest = queryResults[0]["order_items.created_date"]
      console.log('getLatest()', latest)
      setLatestDate(latest)
    } catch (error) {
      console.log('Error when attempting to getLatest(): ' + error.message)
    }
  };

  const saveToParquet = async (click) => {
    console.log('saveToParquet() timestamp:', click.timeStamp)
    console.log('saveToParquet() qid:', qid)

    const userDetails = await sdk.ok(
      sdk.me()
    )
    const displayDetails = {
      name: userDetails.display_name,
      email: userDetails.email,
      role_ids: userDetails.role_ids,
      group_ids: userDetails.group_ids,
      created_at: userDetails.credentials_email.created_at,
    }
    console.log('current user:', displayDetails)
    console.log('requested fields:', qobject.fields)
  }

  const embedCtrRef = useCallback((el) => {
    const hostUrl = extensionContext?.extensionSDK?.lookerHostData?.hostUrl
    if (el && hostUrl) {
      LookerEmbedSDK.init(hostUrl)
      LookerEmbedSDK.createExploreWithId(id)
        .appendTo(el)
        .on('explore:ready', (event) => { updateQid(event.explore.absoluteUrl); getLatest(); updateRunButton(false) })
        .on('explore:run:start', (event) => { updateQid(event.explore.absoluteUrl); getLatest(); updateRunButton(true) })
        .on('explore:run:complete', (event) => { updateQid(event.explore.absoluteUrl); getLatest();updateRunButton(false) })
        .on('explore:state:changed', (event) => { updateQid(event.explore.absoluteUrl); getLatest(); })
        .build()
        .connect()
        .then(setupExplore)
        .catch((error) => {
          console.error('Connection error', error)
        })
    }
  }, [])

  return (
    <>
      <Button onClick={() => setDateFilter(latestDate)}>Set to Latest ({latestDate})</Button>
      <Button m="medium" onClick={runExplore} disabled={running}>
        Run Explore
      </Button>
      <Button onClick={(click) => saveToParquet(click)}>Save as Parquet</Button>
      <EmbedContainer ref={embedCtrRef} />
    </>
  )
}

export default EmbedExplore