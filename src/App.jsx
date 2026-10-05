import { useEffect, useMemo, useState } from 'react'
import './App.css'

const API_URL = 'https://ai-guv-deneyi.onrender.com'

function App() {
  const [participants, setParticipants] = useState([])
  const [status, setStatus] = useState({
    activeDay: null,
    participantCount: 0,
    days: [],
  })
  const [tab, setTab] = useState('days')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadData = async () => {
    try {
      setError('')

      const [resultsResponse, statusResponse] = await Promise.all([
        fetch(`${API_URL}/api/results`),
        fetch(`${API_URL}/api/status`),
      ])

      if (!resultsResponse.ok || !statusResponse.ok) {
        throw new Error('Veriler alınamadı.')
      }

      const results = await resultsResponse.json()
      const currentStatus = await statusResponse.json()

      setParticipants(Array.isArray(results) ? results : [])
      setStatus(currentStatus)
    } catch (err) {
      console.error(err)
      setError('Sunucuya bağlanılamadı.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const startDay = async () => {
    try {
      const response = await fetch(`${API_URL}/api/day/start`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error()
      }

      await loadData()
    } catch {
      setError('Gün başlatılamadı.')
    }
  }

  const endDay = async () => {
    try {
      const response = await fetch(`${API_URL}/api/day/end`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error()
      }

      await loadData()
    } catch {
      setError('Gün bitirilemedi.')
    }
  }

  const answers = useMemo(
    () =>
      participants.flatMap((participant) =>
        Array.isArray(participant.results) ? participant.results : [],
      ),
    [participants],
  )

  const followedAI = answers.filter((item) => item.followedAI === true).length
  const changedAnswers = answers.filter(
    (item) => item.changedAnswer === true,
  ).length
  const aiCorrect = answers.filter(
    (item) => item.aiWasCorrect === true,
  ).length

  const confidenceTotal = answers.reduce(
    (sum, item) => sum + (Number(item.aiConfidence) || 0),
    0,
  )

  const averageConfidence = answers.length
    ? Math.round(confidenceTotal / answers.length)
    : 0

  const followRate = answers.length
    ? Math.round((followedAI / answers.length) * 100)
    : 0

  const changeRate = answers.length
    ? Math.round((changedAnswers / answers.length) * 100)
    : 0

  const aiAccuracy = answers.length
    ? Math.round((aiCorrect / answers.length) * 100)
    : 0

  const dayData = useMemo(() => {
    const grouped = {}

    participants.forEach((participant) => {
      const day = participant.day ?? 'Günsüz'

      if (!grouped[day]) {
        grouped[day] = []
      }

      grouped[day].push(participant)
    })

    return Object.entries(grouped)
  }, [participants])

  const last30 = [...participants].reverse().slice(0, 30)

  return (
    <main className="dashboard">
      <header className="header">
        <div>
          <p className="eyebrow">TÜBİTAK 4006 • ARAŞTIRMA PANELİ</p>
          <h1>AI Güven Deneyi</h1>
          <p className="subtitle">
            Katılımcı sonuçları ve deney hesaplamaları
          </p>
        </div>

        <button className="refresh" type="button" onClick={loadData}>
          ↻ Yenile
        </button>
      </header>

      {error && <div className="error">{error}</div>}

      <section className="day-control">
        <div>
          <span className="label">Deney günü</span>
          <strong>
            {status.activeDay
              ? `${status.activeDay}. gün aktif`
              : 'Aktif gün yok'}
          </strong>
        </div>

        <div className="day-actions">
          <button
            type="button"
            onClick={startDay}
            disabled={Boolean(status.activeDay)}
          >
            Yeni günü başlat
          </button>

          <button
            type="button"
            className="secondary"
            onClick={endDay}
            disabled={!status.activeDay}
          >
            Günü bitir
          </button>
        </div>
      </section>

      <section className="stats">
        <article>
          <span>Katılımcı</span>
          <strong>{participants.length}</strong>
        </article>

        <article>
          <span>AI'ı takip etme</span>
          <strong>%{followRate}</strong>
        </article>

        <article>
          <span>Cevap değiştirme</span>
          <strong>%{changeRate}</strong>
        </article>

        <article>
          <span>AI ort. güven</span>
          <strong>%{averageConfidence}</strong>
        </article>

        <article>
          <span>AI doğruluk</span>
          <strong>%{aiAccuracy}</strong>
        </article>
      </section>

      <nav className="tabs" aria-label="Araştırma bölümleri">
        <button
          type="button"
          className={tab === 'days' ? 'active' : ''}
          onClick={() => setTab('days')}
        >
          Günler
        </button>

        <button
          type="button"
          className={tab === 'total' ? 'active' : ''}
          onClick={() => setTab('total')}
        >
          Toplam Veri
        </button>

        <button
          type="button"
          className={tab === 'last30' ? 'active' : ''}
          onClick={() => setTab('last30')}
        >
          Son 30 Kayıt
        </button>
      </nav>

      <section className="panel">
        {loading ? (
          <p>Veriler yükleniyor…</p>
        ) : tab === 'days' ? (
          <>
            <h2>Günlük veriler</h2>

            {dayData.length === 0 ? (
              <p className="muted">Henüz kayıt yok.</p>
            ) : (
              dayData.map(([day, people]) => {
                const dayAnswers = people.flatMap((person) =>
                  Array.isArray(person.results) ? person.results : [],
                )

                const followed = dayAnswers.filter(
                  (item) => item.followedAI === true,
                ).length

                const changed = dayAnswers.filter(
                  (item) => item.changedAnswer === true,
                ).length

                const followPercent = dayAnswers.length
                  ? Math.round((followed / dayAnswers.length) * 100)
                  : 0

                const changePercent = dayAnswers.length
                  ? Math.round((changed / dayAnswers.length) * 100)
                  : 0

                return (
                  <div className="day-row" key={day}>
                    <div>
                      <strong>
                        {day === 'Günsüz' ? day : `${day}. Gün`}
                      </strong>
                      <span>{people.length} katılımcı</span>
                    </div>

                    <div>
                      <span>
                        AI takip: <b>%{followPercent}</b>
                      </span>
                      <span>
                        Değiştirme: <b>%{changePercent}</b>
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </>
        ) : tab === 'total' ? (
          <>
            <h2>Toplam hesaplamalar</h2>

            <div className="calcs">
              <div>
                <span>Toplam cevap</span>
                <strong>{answers.length}</strong>
              </div>

              <div>
                <span>AI doğru cevap</span>
                <strong>{aiCorrect}</strong>
              </div>

              <div>
                <span>AI yanlış cevap</span>
                <strong>{answers.length - aiCorrect}</strong>
              </div>

              <div>
                <span>AI takip edilen</span>
                <strong>{followedAI}</strong>
              </div>

              <div>
                <span>Değiştirilen cevap</span>
                <strong>{changedAnswers}</strong>
              </div>

              <div>
                <span>Ortalama AI güveni</span>
                <strong>%{averageConfidence}</strong>
              </div>
            </div>

            <div className="research-note">
              <strong>Ana ölçüm:</strong>{' '}
              Katılımcının ilk cevabı AI cevabından farklı olup son cevabı AI
              cevabıyla aynıysa bu cevap “AI'ı takip etti” olarak hesaplanır.
            </div>
          </>
        ) : (
          <>
            <h2>Son 30 kayıt</h2>

            {last30.length === 0 ? (
              <p className="muted">Henüz kayıt yok.</p>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Katılımcı</th>
                      <th>Gün</th>
                      <th>Cevap</th>
                      <th>AI takip</th>
                      <th>AI güven</th>
                    </tr>
                  </thead>

                  <tbody>
                    {last30.map((participant) => {
                      const participantAnswers = Array.isArray(
                        participant.results,
                      )
                        ? participant.results
                        : []

                      const participantFollowed =
                        participantAnswers.filter(
                          (item) => item.followedAI === true,
                        ).length

                      const participantConfidence =
                        participantAnswers.length
                          ? Math.round(
                              participantAnswers.reduce(
                                (sum, item) =>
                                  sum +
                                  (Number(item.aiConfidence) || 0),
                                0,
                              ) / participantAnswers.length,
                            )
                          : 0

                      return (
                        <tr
                          key={`${participant.participantNumber}-${participant.receivedAt}`}
                        >
                          <td>
                            Katılımcı {participant.participantNumber}
                          </td>
                          <td>{participant.day ?? '—'}</td>
                          <td>{participantAnswers.length}</td>
                          <td>{participantFollowed}</td>
                          <td>%{participantConfidence}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  )
}

export default App
