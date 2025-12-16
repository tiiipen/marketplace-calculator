// =========================================================================
// --- LOCK ACCESS FUNCTIONS (TIDAK DIUBAH) ---
// =========================================================================
async function checkCredentials() {
    let phone = document.getElementById("phoneInput").value.trim();
    let email = document.getElementById("emailInput").value.trim();
    
    const btn = document.getElementById("btnSubmit");
    const actionArea = document.getElementById("actionArea");

    actionArea.style.display = "none";
    
    phone = phone.replace(/\D/g,'');

    if (phone.length < 9 || !email.includes("@")) {
        alert("Mohon isi Email dan Nomor HP dengan benar.");
        return;
    }

    if (phone.startsWith("0")) phone = "62" + phone.slice(1);
    else if (phone.startsWith("8")) phone = "62" + phone;

    btn.innerText = "Memverifikasi...";
    btn.disabled = true;

    try {
        const response = await fetch(WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                phone: phone, 
                email: email 
            }) 
        });

        const data = await response.json();

        if (data.status === "success") {
            localStorage.setItem(STORAGE_KEY, "valid");
            unlockApp();
        } else {
            throw new Error("Ditolak");
        }

    } catch (error) {
        console.log("Login Failed:", error);
        actionArea.style.display = "block";
        const card = document.querySelector('.login-card');
        card.style.transform = "translateX(5px)";
        setTimeout(() => card.style.transform = "translateX(0)", 100);
        
        // --- KOREKSI: Tambahkan resize sequence di sini saat error muncul ---
        triggerResizeSequence(); 
        
    } finally {
        btn.innerText = "Masuk Aplikasi";
        btn.disabled = false;
    }
}
// ... sisa script.js Marketplace App Anda ...
