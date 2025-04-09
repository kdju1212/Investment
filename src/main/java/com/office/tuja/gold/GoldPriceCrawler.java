package com.office.tuja.gold;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class GoldPriceCrawler {

	private final GoldStreamController streamController;

	public GoldPriceCrawler(GoldStreamController streamController) {
		this.streamController = streamController;
	}

	@Scheduled(fixedDelay = 10000) // 10초마다 갱신
	public void fetchGoldPrice() {
		try {
			//System.out.println("[GOLD] 금 시세 페이지 접속 중...");
			Document doc = Jsoup.connect("https://www.koreagoldx.co.kr/").get();
			//System.out.println("[GOLD] 페이지 파싱 완료");

			// 이름: <th> 안에서 텍스트 추출
			Element nameEl = doc.selectFirst("th:contains(순금시세)"); // 정확히 순금시세 들어간 <th>
			String name = nameEl != null ? nameEl.text().trim() : "금 시세";

			// 가격: <span class='counter'> 하위의 <td id="spure"> 내부
			Element priceEl = doc.selectFirst("#spure .counter");
			String price = priceEl != null ? priceEl.text().replace(",", "").trim() : "0";

			//System.out.println("🪙 금 시세: " + name + " - " + price);
			String json = String.format("{\"name\":\"%s\", \"price\":\"%s\"}", name, price);
			//System.out.println("[SSE: GOLD] 금 시세 전송: " + json);
			streamController.sendGoldPrice(json);

		} catch (Exception e) {
			System.out.println("[금 크롤링 에러]: " + e.getMessage());
		}
	}
}
