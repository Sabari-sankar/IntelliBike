@echo off
echo ==============================================================
echo         FuelBook Android APK Builder (No Android Studio)
echo ==============================================================
echo.

:: 1. Check Prerequisites
echo [*] Checking environment prerequisites...
where java >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Java Development Kit JDK is not found in your PATH.
    echo Please install OpenJDK 17 or higher and set the JAVA_HOME variable.
    echo Build aborted.
    pause
    exit /b 1
)

if "%ANDROID_HOME%"=="" (
    if "%ANDROID_SDK_ROOT%"=="" (
        echo [WARNING] ANDROID_HOME or ANDROID_SDK_ROOT is not set.
        echo If the build fails, set these environment variables to your Android SDK path.
    )
)

:: 2. Next.js Static Export
echo [*] Step 1: Compiling Next.js project into static export...
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Next.js build failed. Please resolve compile errors before packaging.
    pause
    exit /b 1
)

:: 3. Capacitor Synchronization
echo.
echo [*] Step 2: Synchronizing assets with Capacitor Android wrapper...
call npx cap sync android
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Capacitor sync failed.
    pause
    exit /b 1
)

:: 4. Gradle CLI Compilation
echo.
echo [*] Step 3: Compiling APK using Gradle wrapper...
cd android
call gradlew.bat assembleDebug
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Gradle compilation failed.
    echo Please verify Android SDK build tools and platform targets are configured correctly.
    cd ..
    pause
    exit /b 1
)

cd ..

:: 5. Copy APK to Root for easy accessibility
echo.
echo [*] Step 4: Extracting compiled APK package to project root...
if exist "android\app\build\outputs\apk\debug\app-debug.apk" (
    copy "android\app\build\outputs\apk\debug\app-debug.apk" "FuelBook-debug.apk" >nul
    echo.
    echo ==============================================================
    echo [SUCCESS] APK Compiled Successfully!
    echo ==============================================================
    echo.
    echo Target Package: FuelBook-debug.apk in project root
    echo You can transfer this file to your Android phone to install the app.
) else (
    echo [ERROR] Compiled APK file was not found where expected.
)

pause
