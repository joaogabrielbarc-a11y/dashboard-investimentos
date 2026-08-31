from __future__ import annotations

import re
from urllib.parse import quote

import numpy as np
import pandas as pd
import plotly.express as px
import streamlit as st

DEFAULT_SHEET_ID = "1IrDv70FRuLOT6Y5gFC3naLOUndqhaKHySWcM8v2ysAI"

st.set_page_config(page_title="Dashboard de Carteira", page_icon="⚖️", layout="wide")
st.markdown("""
<style>
.block-container{max-width:1500px;padding-top:1rem}
[data-testid="stMetric"]{border:1px solid rgba(128,128,128,.2);border-radius:14px;padding:12px}
</style>
""", unsafe_allow_html=True)


def brl(x):
    s = f"{float(x):,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
    return f"R$ {s}"


def num(x):
    if x is None or x == "": return np.nan
    if isinstance(x, (int, float, np.number)): return float(x)
    s = str(x).strip().replace("R$", "").replace("%", "")
    if "," in s and "." in s: s = s.replace(".", "").replace(",", ".")
    elif "," in s: s = s.replace(",", ".")
    try: return float(s)
    except ValueError: return np.nan


class SheetReader:
    def __init__(self, spreadsheet_id):
        self.id = spreadsheet_id
        self.sh = None
        try:
            import gspread
            from google.oauth2.service_account import Credentials
            if "gcp_service_account" in st.secrets:
                creds = Credentials.from_service_account_info(
                    dict(st.secrets["gcp_service_account"]),
                    scopes=["https://www.googleapis.com/auth/spreadsheets.readonly",
                            "https://www.googleapis.com/auth/drive.readonly"],
                )
                self.sh = gspread.authorize(creds).open_by_key(self.id)
        except Exception:
            self.sh = None

    def get(self, sheet, rng):
        if self.sh is not None:
            return self.sh.worksheet(sheet).get(rng, value_render_option="UNFORMATTED_VALUE")
        url = f"https://docs.google.com/spreadsheets/d/{self.id}/gviz/tq?tqx=out:csv&sheet={quote(sheet)}"
        df = pd.read_csv(url, header=None)
        a, b = rng.split(":")
        def cell(v):
            m = re.fullmatch(r"([A-Za-z]+)(\d+)", v); col = 0
            for c in m.group(1).upper(): col = col * 26 + ord(c) - 64
            return int(m.group(2)) - 1, col - 1
        r1,c1 = cell(a); r2,c2 = cell(b)
        return df.iloc[r1:r2+1,c1:c2+1].where(pd.notna(df.iloc[r1:r2+1,c1:c2+1]), "").values.tolist()


def rows(values, width):
    return [(list(r)[:width] + [""] * width)[:width] for r in values]


def status(current, target, band):
    if pd.isna(current) or pd.isna(target): return "—"
    if current < target * (1-band): return "ABAIXO"
    if current > target * (1+band): return "ACIMA"
    return "OK"


def balance(df, band):
    d = df.copy()
    d["Limite Inferior"] = d["Peso Alvo"] * (1-band)
    d["Limite Superior"] = d["Peso Alvo"] * (1+band)
    d["Desvio p.p."] = (d["Peso Atual"] - d["Peso Alvo"]) * 100
    d["Status"] = [status(a,b,band) for a,b in zip(d["Peso Atual"], d["Peso Alvo"])]
    return d


def aporte_plan(values, targets, aporte):
    values = values.fillna(0).clip(lower=0); targets = targets.fillna(0).clip(lower=0)
    if aporte <= 0 or targets.sum() <= 0: return pd.Series(0., index=values.index)
    targets = targets / targets.sum(); final = values.sum() + aporte
    deficit = (targets * final - values).clip(lower=0)
    if deficit.sum() <= 0: return pd.Series(0., index=values.index)
    if deficit.sum() <= aporte:
        out = deficit.copy(); out += targets * (aporte - out.sum()); return out
    return deficit / deficit.sum() * aporte


def chart(df, label):
    d = df[[label,"Peso Atual","Peso Alvo"]].melt(label, var_name="Série", value_name="Peso")
    fig = px.bar(d, x=label, y="Peso", color="Série", barmode="group")
    fig.update_yaxes(tickformat=".0%")
    fig.update_layout(height=360, xaxis_title="", yaxis_title="Peso", legend_title_text="")
    st.plotly_chart(fig, use_container_width=True)


st.sidebar.header("⚙️ Controles")
sheet_id = st.sidebar.text_input("ID da Google Sheet", st.secrets.get("spreadsheet_id", DEFAULT_SHEET_ID))
band = st.sidebar.slider("Banda de rebalanceamento", .05, .50, .25, .05, format="%.0f%%")
aporte = st.sidebar.number_input("Aporte a simular (R$)", min_value=0., value=1500., step=100.)
max_asset = st.sidebar.slider("Limite por ativo na classe", .05, .30, .15, .01, format="%.0f%%")
if st.sidebar.button("Atualizar dados"): st.cache_data.clear(); st.rerun()

reader = SheetReader(sheet_id)
try:
    raw = rows(reader.get("Carteira", "B9:F14"), 5)
    cmap = {"Ações":"Ações BR","Fiis":"FIIs","FIIs":"FIIs","ETFs (Internacionais)":"ETFs Internacionais","ETFs":"ETFs Internacionais","Cripto":"Cripto","Renda fixa":"Renda Fixa","Renda Fixa":"Renda Fixa","Stocks":"Stocks"}
    macro = pd.DataFrame([{"Classe":cmap.get(str(r[0]).strip(),str(r[0]).strip()),"Peso Atual":num(r[1]),"Valor":num(r[2]),"Peso Alvo":num(r[3])} for r in raw])
    a = pd.DataFrame(rows(reader.get("Análise de Ações","P20:S26"),4), columns=["Setor","Peso Atual","Valor","Peso Alvo"])
    f = pd.DataFrame(rows(reader.get("Análise de FIIs","Y2:AB7"),4), columns=["Setor","Peso Atual","Valor","Peso Alvo"])
    for d in (a,f):
        for c in ["Peso Atual","Valor","Peso Alvo"]: d[c] = d[c].map(num)
    assets=[]
    aa=pd.DataFrame(rows(reader.get("Análise de Ações","P30:U59"),6),columns=["Setor","Ativo","Preço","Quantidade","Valor","Comprar"]);aa["Classe"]="Ações BR";assets.append(aa)
    ff=pd.DataFrame(rows(reader.get("Análise de FIIs","Y10:AD39"),6),columns=["Setor","Ativo","Preço","Quantidade","Valor","Comprar"]);ff["Classe"]="FIIs";assets.append(ff)
    ee=pd.DataFrame(rows(reader.get("ETFs (Inter) / BTC","B4:G11"),6),columns=["Ativo","Preço","Quantidade","Valor","Peso Atual Interno","Peso Alvo Interno"]);ee["Classe"]="ETFs Internacionais";ee["Setor"]="ETF";assets.append(ee)
    ss=pd.DataFrame(rows(reader.get("Valuation (Stocks)","A31:D60"),4),columns=["Ativo","Preço","Quantidade","Valor"]);ss["Classe"]="Stocks";ss["Setor"]="Stocks";assets.append(ss)
    assets=pd.concat(assets,ignore_index=True,sort=False)
    for c in ["Preço","Quantidade","Valor","Peso Atual Interno","Peso Alvo Interno"]:
        if c in assets: assets[c]=assets[c].map(num)
    assets=assets[assets["Ativo"].astype(str).str.strip().ne("")]
except Exception as exc:
    st.error("Não consegui ler a planilha. Se ela for privada, configure os Secrets do Streamlit e compartilhe a planilha com a Service Account.")
    st.exception(exc); st.stop()

st.title("⚖️ Dashboard de Carteira")
st.caption("Consolidação, pesos, bandas de rebalanceamento e dimensionamento de aportes. Sem valuation.")

with st.expander("🎯 Testar pesos-alvo", expanded=False):
    edit = st.data_editor(macro[["Classe","Peso Alvo"]], hide_index=True, disabled=["Classe"], use_container_width=True,
        column_config={"Peso Alvo":st.column_config.NumberColumn(min_value=0.,max_value=1.,step=.01,format="%.1f%%")})
    if edit["Peso Alvo"].sum()>0: edit["Peso Alvo"] /= edit["Peso Alvo"].sum()
macro["Peso Alvo"] = edit["Peso Alvo"]
mb = balance(macro, band)

c1,c2,c3,c4=st.columns(4)
c1.metric("Patrimônio consolidado", brl(mb["Valor"].fillna(0).sum()))
c2.metric("Aporte simulado", brl(aporte))
c3.metric("Classes fora da banda", int((mb["Status"]!="OK").sum()))
gap=(mb["Peso Alvo"]-mb["Peso Atual"]); c4.metric("Maior déficit", mb.loc[gap.idxmax(),"Classe"])

st.header("1. Macroalocação")
l,r=st.columns([1.3,1])
with l: chart(mb,"Classe")
with r:
    pie=px.pie(mb,names="Classe",values="Valor",hole=.55);pie.update_layout(height=360,legend_title_text="");st.plotly_chart(pie,use_container_width=True)
st.dataframe(mb,hide_index=True,use_container_width=True,column_config={c:st.column_config.NumberColumn(format="%.1f%%") for c in ["Peso Atual","Peso Alvo","Limite Inferior","Limite Superior"]})

st.header("2. Dimensionamento do aporte")
alloc=aporte_plan(mb.set_index("Classe")["Valor"],mb.set_index("Classe")["Peso Alvo"],aporte)
plan=mb.set_index("Classe")[["Valor","Peso Atual","Peso Alvo"]].copy();plan["Aporte Sugerido"]=alloc;plan["Valor Pós-Aporte"]=plan["Valor"]+plan["Aporte Sugerido"]
plan["Peso Pós-Aporte"]=plan["Valor Pós-Aporte"]/plan["Valor Pós-Aporte"].sum();plan["Status Pós-Aporte"]=[status(x,y,band) for x,y in zip(plan["Peso Pós-Aporte"],plan["Peso Alvo"])]
st.dataframe(plan.reset_index(),hide_index=True,use_container_width=True,column_config={"Peso Atual":st.column_config.NumberColumn(format="%.1f%%"),"Peso Alvo":st.column_config.NumberColumn(format="%.1f%%"),"Peso Pós-Aporte":st.column_config.NumberColumn(format="%.1f%%"),"Aporte Sugerido":st.column_config.NumberColumn(format="R$ %.2f")})
fig=px.bar(plan.reset_index(),x="Classe",y="Aporte Sugerido");fig.update_layout(height=300,xaxis_title="",yaxis_title="R$");st.plotly_chart(fig,use_container_width=True)

st.header("3. Balanceamento interno")
def sector_panel(d,title,class_name):
    st.subheader(title); d=balance(d.dropna(subset=["Peso Atual","Peso Alvo"],how="all"),band); chart(d,"Setor")
    class_aporte=float(alloc.get(class_name,0)); blocked=mb.loc[mb["Classe"].eq(class_name),"Status"].eq("ACIMA").any()
    d["Aporte Interno"]=0.
    if not blocked and class_aporte>0: d["Aporte Interno"]=aporte_plan(d.set_index("Setor")["Valor"],d.set_index("Setor")["Peso Alvo"],class_aporte).values
    st.dataframe(d[["Setor","Peso Atual","Peso Alvo","Desvio p.p.","Status","Aporte Interno"]],hide_index=True,use_container_width=True)
    if blocked: st.info(f"{class_name} está acima da banda macro; nenhum novo aporte é direcionado à classe.")
ca,cf=st.columns(2)
with ca: sector_panel(a,"Ações brasileiras","Ações BR")
with cf: sector_panel(f,"Fundos imobiliários","FIIs")

st.header("4. ETFs internacionais")
etfs=assets[assets["Classe"].eq("ETFs Internacionais")].copy()
if not etfs.empty:
    etfs["Peso Atual"]=etfs["Valor"]/etfs["Valor"].sum();etfs["Peso Alvo"]=etfs["Peso Alvo Interno"];eb=balance(etfs,band)
    eb["Aporte Sugerido"]=aporte_plan(eb.set_index("Ativo")["Valor"],eb.set_index("Ativo")["Peso Alvo"],float(alloc.get("ETFs Internacionais",0))).values
    chart(eb,"Ativo");st.dataframe(eb[["Ativo","Valor","Peso Atual","Peso Alvo","Status","Aporte Sugerido"]],hide_index=True,use_container_width=True)

st.header("5. Concentração por ativo")
classes=assets["Classe"].dropna().unique().tolist();selected=st.selectbox("Classe",classes);d=assets[assets["Classe"].eq(selected)].copy();total=d["Valor"].fillna(0).sum();d["Peso na Classe"]=d["Valor"].fillna(0)/total if total else 0;d["Concentração"]=np.where(d["Peso na Classe"]>max_asset,"ACIMA DO LIMITE","OK")
fig=px.bar(d.sort_values("Peso na Classe",ascending=False),x="Ativo",y="Peso na Classe");fig.add_hline(y=max_asset,line_dash="dash");fig.update_yaxes(tickformat=".0%");st.plotly_chart(fig,use_container_width=True)
st.dataframe(d[["Ativo","Setor","Quantidade","Valor","Peso na Classe","Concentração"]].sort_values("Peso na Classe",ascending=False),hide_index=True,use_container_width=True)

st.divider();st.caption("Simulador de alocação: não executa ordens nem altera a planilha. Pesos editados existem apenas durante a sessão.")
