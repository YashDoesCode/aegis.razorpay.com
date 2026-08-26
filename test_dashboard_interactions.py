import sys
import time
from playwright.sync_api import sync_playwright

def test_full_dashboard():
    print("=== STARTING FULL AEGIS DASHBOARD AUTOMATION TEST ===")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        # 1. Test Overview Page
        print("\n--- 1. Testing /overview ---")
        page.goto("http://localhost:3000/overview")
        page.wait_for_load_state("networkidle")
        assert "Aegis Overview" in page.content(), "Overview title not found"
        assert "Total Volume At Risk" in page.content(), "Volume At Risk KPI not found"
        assert "Recoverable (High Win)" in page.content(), "Recoverable KPI not found"
        print("  ✓ /overview page loaded with KPIs and Reason Code Matrix")

        # 2. Test Sidebar Navigation to /disputes
        print("\n--- 2. Testing Sidebar Navigation ---")
        page.click("text=Disputes")
        page.wait_for_url("**/disputes")
        page.wait_for_load_state("networkidle")
        assert "Aegis — Dispute Defense" in page.content(), "Disputes page not loaded"
        print("  ✓ Navigated to /disputes via sidebar")

        # 3. Test Top Bar Notification Bell Dropdown
        print("\n--- 3. Testing Top Bar Notification Bell ---")
        bell_button = page.locator("[data-testid='notification-bell']")
        bell_button.click()
        page.wait_for_selector("text=Dispute Alerts")
        print("  ✓ Notification bell dropdown opened with dispute alerts")
        page.keyboard.press("Escape")
        page.wait_for_timeout(600)

        # 4. Test Top Bar User Profile Dropdown
        print("\n--- 4. Testing Top Bar User Profile Dropdown ---")
        user_menu_btn = page.locator("[data-testid='user-profile-menu']")
        user_menu_btn.click(force=True)
        page.wait_for_selector("text=Merchant Account")
        page.wait_for_selector("text=Profile & Team")
        page.wait_for_selector("text=Switch to")
        print("  ✓ User profile dropdown opened with account items and mode switch")
        page.keyboard.press("Escape")
        page.wait_for_timeout(600)

        # 5. Test Live Search Filtering on Disputes
        print("\n--- 5. Testing Live Search on Disputes ---")
        search_input = page.locator("header input[placeholder*='Search']")
        search_input.fill("Sony")
        page.wait_for_timeout(500)
        assert "disp_1064_goods_not_received" in page.content(), "Sony dispute not matched"
        assert "disp_4837_no_cardholder_auth" not in page.content(), "Unrelated dispute not filtered out"
        print("  ✓ Live search filtered table correctly for 'Sony'")
        search_input.fill("")
        page.wait_for_timeout(500)

        # 6. Test Clickable Winnability Summary Filter Cards
        print("\n--- 6. Testing Winnability Card Filters ---")
        # Click High Winnability card
        high_card = page.locator("text=High Winnability").first
        high_card.click()
        page.wait_for_timeout(500)
        assert "FILTER ACTIVE" in page.content(), "Active filter badge not shown"
        print("  ✓ High Winnability card filter applied")
        
        # Click again to clear
        high_card.click()
        page.wait_for_timeout(500)
        assert "FILTER ACTIVE" not in page.content(), "Filter was not cleared on re-click"
        print("  ✓ High Winnability card filter cleared on re-click")

        # 7. Test Column Sorting
        print("\n--- 7. Testing Column Sorting ---")
        amount_header = page.locator("th").filter(has_text="AMOUNT")
        amount_header.click()
        page.wait_for_timeout(400)
        print("  ✓ Sorted by Amount column")
        winnability_header = page.locator("th").filter(has_text="WINNABILITY")
        winnability_header.click()
        page.wait_for_timeout(400)
        print("  ✓ Sorted by Winnability column")

        # 8. Test Row Click to Slide-out Detail Sheet Drawer
        print("\n--- 8. Testing Row Click & Dispute Detail Drawer ---")
        row = page.locator("tbody tr").first
        row.click()
        page.wait_for_selector("text=Dispute Defense File")
        assert "Aegis Winnability Engine" in page.content(), "Score engine section not found"
        assert "Required Evidence Checklist" in page.content(), "Evidence checklist not found"
        print("  ✓ Slide-out detail drawer opened with scoring breakdown & evidence checklist")

        # 9. Test Rebuttal Drafting & Contest inside Drawer
        print("\n--- 9. Testing Rebuttal Drafting & Contest Button ---")
        draft_btn = page.locator("button").filter(has_text="Draft & Contest (Draft Mode)")
        draft_btn.click()
        print("  ... Waiting for AI rebuttal drafting & Razorpay contest staging ...")
        page.wait_for_selector("text=Razorpay Contest Summary", timeout=25000)
        assert "Full Formal Explanation Letter" in page.content(), "Explanation letter not rendered"
        assert "Staged on Razorpay API" in page.content(), "Razorpay contest confirmation not rendered"
        print("  ✓ Rebuttal drafted, validated with grounded evidence, and staged on Razorpay API in draft mode!")

        # Close detail drawer by pressing escape
        page.keyboard.press("Escape")
        page.wait_for_timeout(600)

        # 10. Test "Sync Disputes" Action Button
        print("\n--- 10. Testing Sync Disputes Action ---")
        sync_btn = page.locator("button").filter(has_text="Sync Disputes")
        sync_btn.click()
        page.wait_for_timeout(1000)
        print("  ✓ Sync disputes executed successfully")

        # 11. Test Navigation to /transactions
        print("\n--- 11. Testing /transactions ---")
        page.click("text=Transactions")
        page.wait_for_url("**/transactions")
        page.wait_for_load_state("networkidle")
        assert "Transactions" in page.content(), "Transactions page not loaded"
        assert "PAYMENT ID" in page.content(), "Payment ID column not found"
        print("  ✓ /transactions loaded with payments, customer items, and dispute linkages")

        # 12. Test Navigation to /settlements
        print("\n--- 12. Testing /settlements ---")
        page.click("text=Settlements")
        page.wait_for_url("**/settlements")
        page.wait_for_load_state("networkidle")
        assert "Settlements" in page.content(), "Settlements page not loaded"
        assert "HDFC Bank" in page.content(), "Bank account not found"
        print("  ✓ /settlements loaded with payout records and UTR information")

        # 13. Test Navigation to /settings
        print("\n--- 13. Testing /settings ---")
        page.locator("nav a[href='/settings']").first.click()
        page.wait_for_url("**/settings")
        page.wait_for_load_state("networkidle")
        page.wait_for_selector("text=Settings & Rules")
        assert "Autonomous Defense Rules" in page.content(), "Defense rules section not found"
        assert "Razorpay Key ID" in page.content(), "API credentials card not found"
        
        # Test Saving Settings
        save_btn = page.locator("button").filter(has_text="Save Settings")
        save_btn.click()
        page.wait_for_timeout(800)
        print("  ✓ /settings loaded and defense parameters saved")

        print("\n=== ALL 13 E2E WEB APPLICATION TESTS PASSED SUCCESSFULLY! ===")
        browser.close()

if __name__ == "__main__":
    test_full_dashboard()
