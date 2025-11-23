import yts from 'yt-search'
import { scrapeYtdown } from '../scrapers/yt1.js'

const handler = async (m, { conn, text, command }) => {
    try {
        if (!text?.trim()) return conn.reply(m.chat, `❀ Por favor, ingresa el nombre de la música a descargar.`, m)
        await m.react('🕒')

        const videoMatch = text.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/|v\/))([a-zA-Z0-9_-]{11})/)
        const query = videoMatch ? 'https://youtu.be/' + videoMatch[1] : text
        const search = await yts(query)
        const result = videoMatch ? search.videos.find(v => v.videoId === videoMatch[1]) || search.all[0] : search.all[0]
        if (!result) throw 'ꕥ No se encontraron resultados.'

        const { title, thumbnail, timestamp, views, ago, url, author, seconds } = result
        if (seconds > 1800) throw '⚠ El contenido supera el límite de duración (30 minutos).'

        const vistas = formatViews(views)
        const info = `「✦」Descargando *<${title}>*\n\n> ❑ Canal » *${author.name}*\n> ♡ Vistas » *${vistas}*\n> ✧︎ Duración » *${timestamp}*\n> ☁︎ Publicado » *${ago}*\n> ➪ Link » ${url}`
        const thumb = (await conn.getFile(thumbnail)).data
        await conn.sendMessage(m.chat, { image: thumb, caption: info }, { quoted: m })

        const scraped = await scrapeYtdown(url)
        
        if (['play', 'yta', 'ytmp3', 'playaudio'].includes(command)) {
            let audioUrl = scraped.audio?.url
            if (!audioUrl) {
                const audio = await getAud(url)
                audioUrl = audio?.url
            }
            if (!audioUrl) throw '⚠ No se pudo obtener el audio.'
            await conn.sendMessage(m.chat, { audio: { url: audioUrl }, fileName: `${title}.mp3`, mimetype: 'audio/mpeg' }, { quoted: m })
            await m.react('✔️')
        } else if (['play2', 'ytv', 'ytmp4', 'mp4'].includes(command)) {
            let videoUrl = scraped.video?.url
            if (!videoUrl) {
                const video = await getVid(url)
                videoUrl = video?.url
            }
            if (!videoUrl) throw '⚠ No se pudo obtener el video.'
            await conn.sendFile(m.chat, videoUrl, `${title}.mp4`, `> ❀ ${title}`, m)
            await m.react('✔️')
        }

    } catch (e) {
        await m.react('✖️')
        return conn.reply(m.chat, typeof e === 'string' ? e : '⚠︎ Se ha producido un problema.\n\n' + e.message, m)
    }
}

handler.command = handler.help = ['play', 'yta', 'ytmp3', 'play2', 'ytv', 'ytmp4', 'playaudio', 'mp4']
handler.tags = ['download']
handler.group = true

export default handler

async function getAud(url) {
    try {
        const endpoint = `${global.APIs.adonix.url}/download/ytaudio?apikey=${global.APIs.adonix.key}&url=${encodeURIComponent(url)}`
        const res = await fetch(endpoint).then(r => r.json())
        if (res.data?.url) return { url: res.data.url }
        return null
    } catch {
        return null
    }
}

async function getVid(url) {
    try {
        const endpoint = `${global.APIs.adonix.url}/download/ytvideo?apikey=${global.APIs.adonix.key}&url=${encodeURIComponent(url)}`
        const res = await fetch(endpoint).then(r => r.json())
        if (res.data?.url) return { url: res.data.url }
        return null
    } catch {
        return null
    }
}

function formatViews(views) {
    if (views === undefined) return "No disponible"
    if (views >= 1_000_000_000) return `${(views / 1_000_000_000).toFixed(1)}B (${views.toLocaleString()})`
    if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M (${views.toLocaleString()})`
    if (views >= 1_000) return `${(views / 1_000).toFixed(1)}k (${views.toLocaleString()})`
    return views.toString()
}
