import { useState } from 'react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

export function Configuracoes() {
  const [agency, setAgency] = useState(() => JSON.parse(window.localStorage.getItem('agencia-diaz-settings') || '{"name":"","email":""}'))
  const [saved, setSaved] = useState(false)
  // Atualiza as preferências da agência em campos controlados.
  function change(event) { setAgency({ ...agency, [event.target.name]: event.target.value }); setSaved(false) }
  // Salva as configurações localmente para sobreviver ao recarregamento.
  function save(event) { event.preventDefault(); window.localStorage.setItem('agencia-diaz-settings', JSON.stringify(agency)); setSaved(true) }
  return <div className="grid max-w-3xl gap-6"><div><p className="mb-2 text-sm font-semibold text-[#7138ef]">Workspace</p><h1 className="text-3xl font-bold text-[#171b32]">Configurações</h1><p className="mt-2 text-sm text-[#737b91]">Personalize sua conta e preferências.</p></div><Card className="p-6"><form onSubmit={save} className="grid gap-5"><div><h2 className="font-bold text-[#171b32]">Dados da agência</h2><p className="mt-1 text-xs text-[#9299ad]">Esses dados ficam salvos somente neste navegador.</p></div><Input label="Nome da agência" name="name" value={agency.name} onChange={change} placeholder="Nome da agência" /><Input label="E-mail de contato" name="email" type="email" value={agency.email} onChange={change} placeholder="contato@agencia.com" /><div className="flex items-center justify-end gap-3 border-t border-[#edf1ee] pt-5">{saved && <span className="text-xs font-semibold text-[#147344]">Salvo</span>}<Button type="submit" className="bg-[#7138ef] hover:bg-[#5f27d4]">Salvar alterações</Button></div></form></Card></div>
}
