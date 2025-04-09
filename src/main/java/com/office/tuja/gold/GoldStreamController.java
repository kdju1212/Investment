package com.office.tuja.gold;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.concurrent.CopyOnWriteArrayList;

@RestController
public class GoldStreamController {

	private final CopyOnWriteArrayList<SseEmitter> emitters = new CopyOnWriteArrayList<>();

	@GetMapping("/gold-stream")
	public SseEmitter stream() {
		SseEmitter emitter = new SseEmitter();
		emitters.add(emitter);
		System.out.println("[SSE: GOLD] 클라이언트 연결됨. 현재 연결 수: " + emitters.size());

		emitter.onCompletion(() -> {
			emitters.remove(emitter);
			System.out.println("[SSE: GOLD] 연결 완료. 남은 연결 수: " + emitters.size());
		});

		emitter.onTimeout(() -> {
			emitters.remove(emitter);
			System.out.println("[SSE: GOLD] 타임아웃 발생. 연결 제거. 남은 연결 수: " + emitters.size());
		});

		return emitter;
	}

	public void sendGoldPrice(String jsonMessage) {
		//System.out.println("[SSE: GOLD] 금 시세 전송: " + jsonMessage);
		for (SseEmitter emitter : emitters) {
			try {
				emitter.send(jsonMessage);
			} catch (IOException e) {
				emitters.remove(emitter);
				System.out.println("[SSE: GOLD] 전송 실패로 연결 제거됨.");
			}
		}
	}
}
