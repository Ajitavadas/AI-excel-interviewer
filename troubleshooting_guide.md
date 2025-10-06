# AI Excel Interviewer Backend - Import Error Troubleshooting Guide

## Problem Analysis

The error "Could not import module 'main'" indicates that the ASGI server (likely uvicorn) cannot find or import your main.py module. Based on the code analysis, here are the identified issues and solutions:

## Issues Found

### 1. 🔥 CRITICAL: Filename Typo
- **Problem**: The attached file is named `interviev.py` (with a typo)
- **Expected**: `interview.py`
- **Impact**: `main.py` tries to import `app.api.routes.interview` but the file is named `interviev.py`

### 2. 🔄 Import Path Inconsistencies
- **Problem**: Mixed absolute and relative imports across files
- **Files affected**: `database.py` uses relative imports while others use absolute

### 3. 📁 Directory Structure Verification Needed
- **Problem**: Missing or incorrectly placed `__init__.py` files
- **Impact**: Python cannot recognize directories as packages

## Solutions

### Step 1: Fix the Filename (CRITICAL)
```bash
# In your app/api/routes/ directory
mv interviev.py interview.py
```

### Step 2: Verify Directory Structure
Your directory structure should look exactly like this:
```
backend/
├── main.py
├── requirements.txt
└── app/
    ├── __init__.py
    ├── core/
    │   ├── __init__.py
    │   ├── config.py
    │   └── database.py
    ├── api/
    │   ├── __init__.py
    │   └── routes/
    │       ├── __init__.py
    │       └── interview.py  # ← Fixed filename
    └── services/
        ├── __init__.py
        └── llm_service.py
```

### Step 3: Create/Verify __init__.py Files
Make sure each __init__.py contains appropriate content:

**app/__init__.py**:
```python
"""
AI Excel Interviewer Application Package
"""
__version__ = "1.0.0"
```

**app/core/__init__.py**:
```python
"""
Core module for configuration and database setup
"""
from .config import settings

__all__ = ["settings"]
```

**app/api/__init__.py**:
```python
"""
API module containing FastAPI routes and endpoints
"""
```

**app/api/routes/__init__.py**:
```python
"""
API routes for the AI Excel Interviewer
"""
```

**app/services/__init__.py**:
```python
"""
Services module containing business logic and external service integrations
"""
from .llm_service import llm_service

__all__ = ["llm_service"]
```

### Step 4: Fix database.py Import
Change the relative import in `database.py`:
```python
# BEFORE (problematic):
from .config import settings

# AFTER (correct):
from app.core.config import settings
```

### Step 5: Verify Working Directory
When running the application, make sure you're in the `backend/` directory:
```bash
cd backend/
python main.py
# OR
uvicorn main:app --reload
```

### Step 6: Alternative Running Methods
If you're using Docker or another container system:
```bash
# From backend directory
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## Testing the Fix

1. **Test import manually**:
```bash
cd backend/
python -c "from app.core.config import settings; print('Config import works!')"
python -c "from app.api.routes.interview import router; print('Interview router import works!')"
python -c "from app.services.llm_service import llm_service; print('LLM service import works!')"
```

2. **Test main.py import**:
```bash
cd backend/
python -c "import main; print('Main module import works!')"
```

3. **Run the application**:
```bash
cd backend/
python main.py
```

## Common Pitfalls to Avoid

1. **Don't run from wrong directory** - Always run from the `backend/` directory
2. **Don't mix import styles** - Use consistent absolute imports
3. **Don't skip __init__.py files** - Every directory needs one to be a Python package
4. **Don't ignore case sensitivity** - File names must match import statements exactly
5. **Don't forget the typo fix** - `interviev.py` → `interview.py`

## Docker Considerations

If you're running in Docker, ensure your Dockerfile sets the correct working directory:
```dockerfile
WORKDIR /app/backend
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## Final Verification

After implementing all fixes, you should be able to:
1. Import all modules without errors
2. Start the FastAPI application successfully
3. Access the API endpoints at http://localhost:8000
4. See the API documentation at http://localhost:8000/docs

If you still encounter issues after following this guide, the problem might be:
- Environment/dependency issues (check requirements.txt)
- Permission problems
- Python path configuration issues
