document.addEventListener("DOMContentLoaded", function () {
  let currentMonth = new Date().getMonth() + 1;
  let currentYear = new Date().getFullYear();

  // โหลดการจองเมื่อเริ่มต้น
  loadBookings();

  // ตั้งค่าแสดงเดือนและปีปัจจุบันใน UI
  updateCalendarHeader(currentMonth, currentYear);

  // โหลดเวลาว่างเมื่อเปลี่ยนวันที่ในฟอร์ม
  document.getElementById("date").addEventListener("change", function () {
    loadAvailableTimes(this.value);
  });

  // ส่งฟอร์มข้อมูลการจอง
  document
    .getElementById("booking-form")
    .addEventListener("submit", function (event) {
      event.preventDefault();
      const name = document.getElementById("name").value;
      const date = document.getElementById("date").value;
      const time = document.getElementById("time").value;

      if (name && date && time) {
        fetch("/book", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name, date, time }),
        })
          .then((response) => response.json())
          .then((result) => {
            if (result.success) {
              alert("จองสำเร็จ");
              loadBookings(); // อัพเดตปฏิทินหลังจากจอง
            } else {
              alert(result.message);
            }
          })
          .catch((error) => {
            console.error("Error:", error);
          });
      } else {
        alert("กรุณากรอกข้อมูลให้ครบถ้วน");
      }
    });

  // ฟังก์ชันสำหรับโหลดการจองของเดือนและปีที่เลือก
  function loadBookings() {
    let currentMonth = new Date().getMonth() + 1;
    let currentYear = new Date().getFullYear();
    fetch(`/bookings?month=${currentMonth}&year=${currentYear}`)
      .then((response) => response.json())
      .then((bookings) => {
        console.log("Bookings received:", bookings);
        renderCalendar(currentMonth, currentYear, bookings);
        updateCalendarHeader(currentMonth, currentYear);
      })
      .catch((error) => {
        console.error("Error loading bookings:", error);
      });
  }

  // ฟังก์ชันสำหรับอัพเดทส่วนหัวของปฏิทิน
  function updateCalendarHeader(month, year) {
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    document.getElementById("current-month-year").textContent = `${
      monthNames[month - 1]
    } ${year}`;
  }

  // ฟังก์ชันสำหรับแสดงปฏิทิน
  function renderCalendar(month, year, bookings) {
    console.log("Rendering calendar for", month, year);
    const calendarElement = document.getElementById("calendar");
    calendarElement.innerHTML = ""; // ล้างปฏิทินเก่า

    const firstDayOfMonth = new Date(year, month - 1, 1).getDay();
    const daysInMonth = new Date(year, month, 0).getDate();

    // แสดงวันที่ในปฏิทิน
    for (let i = 0; i < firstDayOfMonth; i++) {
      const blankCell = document.createElement("div");
      calendarElement.appendChild(blankCell);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(
        day
      ).padStart(2, "0")}`;
      const dayElement = document.createElement("div");
      dayElement.classList.add("calendar-day");
      dayElement.textContent = day;

      // ตรวจสอบว่ามีการจองในวันนี้หรือไม่
      const booking = bookings.find((booking) => booking.date === dateStr);
      if (booking) {
        dayElement.classList.add("booked");
      } else {
        dayElement.classList.add("available");
      }

      dayElement.addEventListener("click", function () {
        if (booking) {
          showBookingDetails(booking);
        }
      });

      calendarElement.appendChild(dayElement);
    }
  }

  // ฟังก์ชันสำหรับแสดงรายละเอียดการจอง
  function showBookingDetails(booking) {
    const modal = document.getElementById("booking-details");
    const detailsContent = document.getElementById("details-content");
    detailsContent.innerHTML = `
                    <ul>
                        <li><strong>ชื่อ:</strong> ${booking.name}</li>
                        <li><strong>วันที่:</strong> ${booking.date}</li>
                        <li><strong>เวลา:</strong> ${booking.time}</li>
                    </ul>
                `;
    modal.style.display = "block";
  }

  // ฟังก์ชันสำหรับโหลดเวลาที่ว่าง
  function loadAvailableTimes(date) {
    fetch(`/available_times?date=${date}`)
      .then((response) => response.json())
      .then((times) => {
        const timeSelect = document.getElementById("time");
        timeSelect.innerHTML = '<option value="">เลือกเวลา</option>';
        times.forEach((time) => {
          const option = document.createElement("option");
          option.value = time;
          option.textContent = time;
          timeSelect.appendChild(option);
        });
      })
      .catch((error) => {
        console.error("Error loading available times:", error);
      });
  }

  // ปิด modal เมื่อกดปุ่ม close
  document.querySelector(".close").addEventListener("click", function () {
    document.getElementById("booking-details").style.display = "none";
  });
});
