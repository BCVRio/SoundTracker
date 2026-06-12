import { google } from 'googleapis'

const FOLDER_PATH = ['LOCATION SOUND', 'RECORDING LOGS', 'Shure Production']
const SHEET_TITLE = 'Recording Log'
const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive',
]
const HEADERS = ['Date', 'Time', 'Scene / Shot', 'Take', 'Crew Member', 'Description', 'Location', 'Notes', 'Logged At']

let sheets = null
let drive = null
let spreadsheetId = null

function getAuth() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
  if (!raw) return null
  try {
    return new google.auth.GoogleAuth({ credentials: JSON.parse(raw), scopes: SCOPES })
  } catch {
    console.error('[Sheets] Invalid GOOGLE_SERVICE_ACCOUNT_KEY JSON')
    return null
  }
}

async function getOrCreateFolder(name, parentId) {
  const q = [
    `name = '${name}'`,
    `mimeType = 'application/vnd.google-apps.folder'`,
    `trashed = false`,
    parentId ? `'${parentId}' in parents` : `'root' in parents`,
  ].join(' and ')

  const { data } = await drive.files.list({ q, fields: 'files(id)', spaces: 'drive' })
  if (data.files.length) return data.files[0].id

  const { data: folder } = await drive.files.create({
    requestBody: {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      ...(parentId ? { parents: [parentId] } : {}),
    },
    fields: 'id',
  })
  return folder.id
}

async function getOrCreateSpreadsheet(folderId) {
  const q = [
    `name = '${SHEET_TITLE}'`,
    `mimeType = 'application/vnd.google-apps.spreadsheet'`,
    `'${folderId}' in parents`,
    `trashed = false`,
  ].join(' and ')

  const { data } = await drive.files.list({ q, fields: 'files(id)', spaces: 'drive' })
  if (data.files.length) return data.files[0].id

  const { data: ss } = await sheets.spreadsheets.create({
    requestBody: {
      properties: { title: SHEET_TITLE },
      sheets: [{ properties: { title: 'Recordings' } }],
    },
  })
  const id = ss.spreadsheetId

  // Move into the correct folder
  await drive.files.update({
    fileId: id,
    addParents: folderId,
    removeParents: 'root',
    fields: 'id',
  })

  // Write header row
  await sheets.spreadsheets.values.update({
    spreadsheetId: id,
    range: 'Recordings!A1',
    valueInputOption: 'RAW',
    requestBody: { values: [HEADERS] },
  })

  // Bold + freeze the header row
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: id,
    requestBody: {
      requests: [
        {
          repeatCell: {
            range: { sheetId: 0, startRowIndex: 0, endRowIndex: 1 },
            cell: { userEnteredFormat: { textFormat: { bold: true } } },
            fields: 'userEnteredFormat.textFormat.bold',
          },
        },
        {
          updateSheetProperties: {
            properties: { sheetId: 0, gridProperties: { frozenRowCount: 1 } },
            fields: 'gridProperties.frozenRowCount',
          },
        },
      ],
    },
  })

  // Share with user if email provided
  const shareEmail = process.env.GOOGLE_DRIVE_SHARE_EMAIL
  if (shareEmail) {
    await drive.permissions.create({
      fileId: folderId,
      requestBody: { type: 'user', role: 'writer', emailAddress: shareEmail },
      sendNotificationEmail: false,
    })
    console.log(`[Sheets] Shared folder with ${shareEmail}`)
  }

  return id
}

export async function initSheets() {
  const auth = getAuth()
  if (!auth) {
    console.log('[Sheets] GOOGLE_SERVICE_ACCOUNT_KEY not set — Google Sheets sync disabled')
    return
  }
  try {
    const client = await auth.getClient()
    sheets = google.sheets({ version: 'v4', auth: client })
    drive = google.drive({ version: 'v3', auth: client })

    let parentId = null
    for (const name of FOLDER_PATH) {
      parentId = await getOrCreateFolder(name, parentId)
    }

    spreadsheetId = await getOrCreateSpreadsheet(parentId)
    console.log(`[Sheets] Ready — spreadsheet ID: ${spreadsheetId}`)
  } catch (err) {
    console.error('[Sheets] Init failed:', err.message)
  }
}

export async function appendRecording(r) {
  if (!sheets || !spreadsheetId) return
  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Recordings!A:I',
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [[
          r.date,
          r.time,
          r.scene,
          r.take,
          r.crew_member,
          r.description,
          r.location ?? '',
          r.notes ?? '',
          new Date(r.created_at).toISOString(),
        ]],
      },
    })
  } catch (err) {
    console.error('[Sheets] Append failed:', err.message)
  }
}
