package com.office.tuja.stock;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.select.Elements;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class NaverStockCrawler {

	private final StockStreamController streamController;

	public NaverStockCrawler(StockStreamController streamController) {
		this.streamController = streamController;
	}

	@Scheduled(fixedDelay = 5000)
	public void fetchStockPrice() {
		String[] codes = { "005930", "000660", "035420" }; // 삼성전자, SK하이닉스, NAVER

		for (String code : codes) {
			try {
				Document doc = Jsoup.connect("https://finance.naver.com/item/main.naver?code=" + code).get();
				Elements priceEl = doc.select("p.no_today span.blind");

				if (!priceEl.isEmpty()) {
					String price = priceEl.get(0).text();
					String jsonMessage = String.format("{\"code\":\"%s\", \"price\":\"%s\"}", code, price);
					//System.out.println("📈 " + code + " 현재가: " + price);
					streamController.sendStockPrice(jsonMessage);
				}
			} catch (Exception e) {
				System.out.println("[크롤링 에러 - " + code + "]: " + e.getMessage());
			}
		}
	}

}
