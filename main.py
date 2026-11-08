
from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

app = FastAPI(
    title="Sync",
    description="Sistema de organização pessoal",
    version="0.1.0"
)

app.mount("/static", StaticFiles(directory="static"), name="static")

templates = Jinja2Templates(directory="templates")


@app.get("/")
async def login(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="login.html",
        context={"request": request}
    )


@app.get("/dashboard")
async def dashboard(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="dashboard.html",
        context={"request": request}
    )


@app.get("/agenda")
async def agenda(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="agenda.html",
        context={"request": request}
    )


@app.get("/financas")
async def financas(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="financas.html",
        context={"request": request}
    )
