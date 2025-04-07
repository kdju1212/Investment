package com.office.tuja.stock;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.concurrent.CopyOnWriteArrayList;

@RestController
public class StockStreamController {

	private final CopyOnWriteArrayList<SseEmitter> emitters = new CopyOnWriteArrayList<>();

	@GetMapping("/stock-stream")
	public SseEmitter stream() {
		SseEmitter emitter = new SseEmitter(0L);
		emitters.add(emitter);

		System.out.println("[SSE] 클라이언트 연결됨. 현재 연결 수: " + emitters.size());

		emitter.onCompletion(() -> {
			emitters.remove(emitter);
			System.out.println("[SSE] 클라이언트 연결 종료. 남은 연결 수: " + emitters.size());
		});

		emitter.onTimeout(() -> {
			emitters.remove(emitter);
			System.out.println("[SSE] 타임아웃 발생. 연결 제거. 남은 연결 수: " + emitters.size());
		});

		return emitter;
	}

	public void sendStockPrice(String jsonMessage) {
		System.out.println("[SSE] 주식 가격 전송: " + jsonMessage);

		for (SseEmitter emitter : emitters) {
			try {
				emitter.send(jsonMessage);
			} catch (IOException e) {
				emitters.remove(emitter);
				System.out.println("[SSE] 전송 실패. 연결 제거. 남은 연결 수: " + emitters.size());
			}
		}
	}
}
