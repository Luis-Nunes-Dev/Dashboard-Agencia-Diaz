import { useEffect, useState } from 'react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { supabase } from '../lib/supabase'

export function Configuracoes() {
  const [agency, setAgency] = useState({ name: '', email: '' })
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function loadAgency() {
      const { data, error: queryError } = await supabase
        .from('agency_settings')
        .select('*')
        .limit(1)
        .maybeSingle()

      if (!active) return
      if (queryError) setError('Não foi possível carregar as configurações da agência.')
      else if (data) setAgency(data)
    }

    loadAgency()
    return () => { active = false }
  }, [])

  // Atualiza as preferências da agência em campos controlados.
  function change(event) { setAgency({ ...agency, [event.target.name]: event.target.value }); setSaved(false) }
  async function save(event) {
    event.preventDefault()
    const query = agency.id
      ? supabase.from('agency_settings').update({ name: agency.name, email: agency.email }).eq('id', agency.id)
      : supabase.from('agency_settings').insert({ name: agency.name, email: agency.email })
    const { data, error: saveError } = await query.select('*').single()

    if (saveError) {
      setError('Não foi possível salvar as configurações da agência.')
      setSaved(false)
      return
    }

    setAgency(data)
    setError('')
    setSaved(true)
  }

  return <div className="grid max-w-3xl gap-6"><div><p className="mb-2 text-sm font-semibold text-[#7138ef]">Workspace</p><h1 className="text-3xl font-bold text-[#171b32]">Configurações</h1><p className="mt-2 text-sm text-[#737b91]">Personalize sua conta e preferências.</p></div><Card className="p-6"><form onSubmit={save} className="grid gap-5"><div><h2 className="font-bold text-[#171b32]">Dados da agência</h2><p className="mt-1 text-xs text-[#9299ad]">Esses dados ficam salvos somente neste navegador.</p></div>{error && <p className="text-sm font-semibold text-[#b42345]">{error}</p>}<Input label="Nome da agência" name="name" value={agency.name} onChange={change} placeholder="Nome da agência" /><Input label="E-mail de contato" name="email" type="email" value={agency.email} onChange={change} placeholder="contato@agencia.com" /><div className="flex items-center justify-end gap-3 border-t border-[#edf1ee] pt-5">{saved && <span className="text-xs font-semibold text-[#147344]">Salvo</span>}<Button type="submit" className="bg-[#7138ef] hover:bg-[#5f27d4]">Salvar alterações</Button></div></form></Card></div>
}
