from fastapi import FastAPI

app = FastAPI(
    title="DataSentry API",
    description="Automated CSV data quality analysis",
    version="0.1.0",
)


@app.get("/")
def root():
    return {"message": "Welcome to DataSentry"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}