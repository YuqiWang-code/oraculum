<template>
  <div class="card share-card">
    <h2>🎴 生成分享卡片</h2>
    <p class="muted">把今天这一卦做成一张图，自己留着或发给朋友。图片在本机生成，不含你的隐私信息。</p>
    <div v-if="posterUrl" class="poster-wrap">
      <img :src="posterUrl" class="share-poster" alt="今日卦象分享图" />
      <a :href="posterUrl" download="oraculum-今日卦象.png" class="btn cinnabar" style="text-align:center;text-decoration:none">保存图片</a>
      <button class="btn secondary" @click="shareImage">分享图片</button>
    </div>
    <button v-else class="btn" @click="generate">生成分享图</button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  name: string
  unicode?: string
  oneLiner: string
  tendencyLabel?: string
}>()

const posterUrl = ref('')

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

/** 按字符折行（中文按字宽估算） */
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = []
  let line = ''
  for (const ch of text) {
    const test = line + ch
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line)
      line = ch
    } else {
      line = test
    }
  }
  if (line) lines.push(line)
  return lines
}

function generate() {
  const W = 750
  const H = 1040
  const canvas = document.createElement('canvas')
  const dpr = 2
  canvas.width = W * dpr
  canvas.height = H * dpr
  const ctx = canvas.getContext('2d')!
  ctx.scale(dpr, dpr)

  const dark = window.matchMedia('(prefers-color-scheme: dark)').matches

  // 背景纸
  const bg = ctx.createLinearGradient(0, 0, W, H)
  if (dark) {
    bg.addColorStop(0, '#2a251d'); bg.addColorStop(1, '#221e17')
  } else {
    bg.addColorStop(0, '#fbf6ea'); bg.addColorStop(1, '#f1e6cf')
  }
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  const ink = dark ? '#efe9dd' : '#2a2520'
  const muted = dark ? '#b7ab95' : '#8a7f6d'
  const cinnabar = '#b0432d'
  const gold = '#a98c4f'

  // 外边框
  ctx.strokeStyle = gold
  ctx.lineWidth = 3
  roundRect(ctx, 28, 28, W - 56, H - 56, 18)
  ctx.stroke()
  ctx.lineWidth = 1
  roundRect(ctx, 40, 40, W - 80, H - 80, 12)
  ctx.stroke()

  // 顶部小字
  ctx.textAlign = 'center'
  ctx.fillStyle = muted
  ctx.font = '24px "Songti SC", "SimSun", serif'
  ctx.fillText('今 日 问 卦', W / 2, 104)

  // 卦符
  if (props.unicode) {
    ctx.fillStyle = ink
    ctx.font = '120px serif'
    ctx.fillText(props.unicode, W / 2, 250)
  }

  // 卦名印章
  const sealSize = 120
  const sx = W / 2 - sealSize / 2
  const sy = props.unicode ? 268 : 150
  ctx.fillStyle = cinnabar
  roundRect(ctx, sx, sy, sealSize, sealSize, 12)
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,246,238,0.6)'
  ctx.lineWidth = 3
  roundRect(ctx, sx + 8, sy + 8, sealSize - 16, sealSize - 16, 7)
  ctx.stroke()
  ctx.fillStyle = '#fff6ee'
  ctx.font = 'bold 56px "Songti SC", "SimSun", serif'
  ctx.fillText(props.name, W / 2, sy + 78)

  if (props.tendencyLabel) {
    ctx.fillStyle = muted
    ctx.font = '22px sans-serif'
    ctx.fillText(props.tendencyLabel, W / 2, sy + sealSize + 40)
  }

  // 一句话（折行）
  ctx.fillStyle = ink
  ctx.font = '34px "PingFang SC", "Microsoft YaHei", sans-serif'
  const lines = wrapText(ctx, props.oneLiner, W - 150)
  const startY = sy + sealSize + 110
  const lineH = 52
  lines.slice(0, 5).forEach((ln, i) => {
    ctx.fillText(ln, W / 2, startY + i * lineH)
  })

  // 底部
  ctx.fillStyle = muted
  ctx.font = '20px sans-serif'
  ctx.fillText('传统文化思考 · 结果由本机离线计算，不预测未来', W / 2, H - 96)
  ctx.fillStyle = cinnabar
  ctx.font = 'bold 24px "Songti SC", serif'
  ctx.fillText('—— Oraculum 今日问卦', W / 2, H - 56)

  posterUrl.value = canvas.toDataURL('image/png')
}

async function shareImage() {
  if (!posterUrl.value) return
  try {
    const blob = await (await fetch(posterUrl.value)).blob()
    const file = new File([blob], 'oraculum-今日卦象.png', { type: 'image/png' })
    const nav = navigator as Navigator & {
      share?: (d: { files?: File[]; title?: string; text?: string }) => Promise<void>
      canShare?: (d: { files: File[] }) => boolean
    }
    if (nav.share && nav.canShare?.({ files: [file] })) {
      await nav.share({ files: [file], title: '今日问卦' })
      return
    }
  } catch {
    /* 用户取消或不支持，回退提示保存 */
  }
  alert('请长按或点击「保存图片」后分享。')
}
</script>

<style scoped>
.poster-wrap { margin-top: 10px; }
</style>
