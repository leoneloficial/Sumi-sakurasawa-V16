import yts from 'yt-search'
import { scrapeYtdown } from '../scrapers/yt1.js'
import fetch from 'node-fetch'

const handler = async (m, { conn, text, command }) => {
    try {
        if (!text?.trim()) return conn.reply(m.chat, `❀ *Sistema de Descargas.*\n\nRequerimiento:\n✰ *Por favor, ingrese el título o enlace del video.*`, m)
        await m.react('🕒')

        const videoMatch = text.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/|v\/))([a-zA-Z0-9_-]{11})/)
        const query = videoMatch ? 'https://youtu.be/' + videoMatch[1] : text
        const search = await yts(query)
        const result = videoMatch ? search.videos.find(v => v.videoId === videoMatch[1]) || search.all[0] : search.all[0]
        if (!result) throw '✰ *No se encontraron resultados para la búsqueda.*'

        const { title, thumbnail, timestamp, views, ago, url, author, seconds } = result
        if (seconds > 1800) throw '✰ *El contenido excede la duración máxima permitida (30m).*'

        const vistas = formatViews(views)

        const info = `❀ *Descargas De YouTube*\n\n` +
        `Detalles del contenido:\n` +
        `✰ *Título › ${title}*\n` +
        `✰ *Autor › ${author.name}*\n` +
        `✰ *Duración › ${timestamp} | Vistas › ${vistas}*\n\n` +
        `_Su archivo está siendo procesado, por favor espere un momento._\n` +
        `↺ Publicado ${ago}.`

        const thumb = (await conn.getFile(thumbnail)).data
        await conn.sendMessage(m.chat, { image: thumb, caption: info }, { quoted: m })

        const scraped = await scrapeYtdown(url)

        if (['play', 'yta', 'ytmp3', 'playaudio'].includes(command)) {
            let audioUrl = scraped.audio?.url
            if (!audioUrl) {
                const audio = await getAud(url)
                audioUrl = audio?.url
            }
            if (!audioUrl) throw '✰ *Error al procesar el audio del contenido.*'

            await conn.sendMessage(m.chat, { audio: { url: audioUrl }, fileName: `${title}.mp3`, mimetype: 'audio/mpeg' }, { quoted: m })
            await m.react('✅')

        } else if (['play2', 'ytv', 'ytmp4', 'mp4'].includes(command)) {
            let videoUrl = scraped.video?.url
            if (!videoUrl) {
                const video = await getVid(url)
                videoUrl = video?.url
            }
            if (!videoUrl) throw '✰ *Error al procesar el video del contenido.*'

            await conn.sendFile(m.chat, videoUrl, `${title}.mp4`, `❀ *Archivo completado › ${title}*`, m)
            await m.react('✅')
        }

    } catch (e) {
        await m.react('✖️')
        return conn.reply(m.chat, typeof e === 'string' ? e : `❀ *Sistema de Descargas.*\n\nError crítico:\n✰ *${e.message}*`, m)
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
    if (views === undefined) return "N/A"
    if (views >= 1_000_000_000) return `${(views / 1_000_000_000).toFixed(1)}B`
    if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M`
    if (views >= 1_000) return `${(views / 1_000).toFixed(1)}k`
    return views.toString()
}