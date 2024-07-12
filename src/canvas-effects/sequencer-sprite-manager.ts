import { BooleanField } from "foundry-pf2e/src/types/foundry/common/data/fields.js";
import { AnimatedTilingSprite } from "../lib/pixi/AnimatedTilingSprite.js";
import SequencerFileCache from "../modules/sequencer-file-cache.js";

//#region Ambient types declaration
declare abstract class SequencerFileBase {
	getFile: () => string;
	getAllFiles: () => string[];
	readonly isFlipbook: boolean;
}
declare class SequencerFile extends SequencerFileBase {
	readonly rangeFind: false;
}
declare class SequencerFileRangeFind extends SequencerFileBase {
	readonly rangeFind: true;
}
interface SequencerFileCache {
	loadFile: (inSrc: string, preload?: boolean) => Promise<Blob | PIXI.Texture | PIXI.Spritesheet | boolean>;
}

declare global {
	const SequencerFileCache: SequencerFileCache;
}
//#endregion

//#region Auxiliary types
interface Position {
	x: number;
	y: number;
}

interface FrameObject {
	texture: PIXI.Texture;
	time: number;
}
//#endregion

//#region Assets
abstract class Asset {
	destroy(): void {
		// nothing to do in the general case
	}
}

class TextureAsset extends Asset {
	readonly filepath: string;
	readonly texture: PIXI.Texture;
	constructor({ filepath, texture }: { filepath: string; texture: PIXI.Texture }) {
		super();
		this.filepath = filepath;
		this.texture = texture;
	}
}
class VideoAsset extends Asset {
	filepath: string;
	texture: PIXI.Texture;
	video: HTMLVideoElement;

	constructor({ filepath, texture, video }: { filepath: string; texture: PIXI.Texture; video: HTMLVideoElement }) {
		super();
		this.filepath = filepath;
		this.texture = texture;
		this.video = video;
	}

	override destroy(): void {
		try {
			this.video.removeAttribute("src");
			this.video.pause();
			this.video.load();
			this.video = null!;
		} catch (err) {}
		this.texture.destroy();
	}
}
class VideoSpritesheetAsset extends Asset {
	filepath: string;
	spritesheet: PIXI.Spritesheet;
	frameObjects: FrameObject[];
	framerate: number;

	constructor({ filepath, spritesheet }: { filepath: string; spritesheet: PIXI.Spritesheet }) {
		super();
		this.filepath = filepath;
		this.spritesheet = spritesheet;
		this.framerate = (this.spritesheet.data?.meta as any)?.framerate ?? 30;
		const frametime = 1 / this.framerate;
		this.frameObjects = (Object.values(spritesheet.animations)[0] ?? []).map((texture) => ({
			texture,
			time: frametime,
		}));
		this.#register();
	}

	override destroy(): void {
		SequencerFileCache.unloadSpritesheet(this.filepath);
	}

	#register() {
		SequencerFileCache.registerSpritesheet(this.filepath, this.spritesheet);
	}
}

class FlipbookAsset extends Asset {
	filepaths: string[];
	frameObjects: FrameObject[];
	framerate: number;

	constructor({
		filepaths,
		textures,
		framerate = 24,
	}: {
		filepaths: string[];
		textures: PIXI.Texture[];
		framerate: number;
	}) {
		super();
		this.filepaths = filepaths;
		this.framerate = framerate;
		const frametime = 1 / framerate;
		this.frameObjects = textures.map((texture) => ({ texture, time: frametime }));
	}

	override destroy(): void {
		// TODO maybe add spritesheet-like ref counting for flipbooks too?
	}
}

class TextAsset extends Asset {
	text: string;

	constructor({ text }: { text: string }) {
		super();
		this.text = text;
	}

	// really nothing to do here
	override destroy(): void {}
}
//#endregion

//#region Managed Sprites
abstract class ManagedSprite<AssetType extends Asset = Asset> {
	abstract view: PIXI.Sprite;
	asset: AssetType;

	get texture(): PIXI.Texture {
		return this.view.texture
	}

	constructor(asset: AssetType) {
		this.asset = asset;
	}

	destroy() {
		this.view.destroy();
		this.view = null!;
		this.asset.destroy();
		this.asset = null!;
	}
	deactivate(): void {
		this.view.renderable = false;
	}
	activate(): void {
		this.view.renderable = true;
	}
}

class ManagedTextSprite extends ManagedSprite<TextAsset> {
	view: PIXI.Text;

	constructor({ asset, textStyle }: { asset: TextAsset; textStyle?: Partial<PIXI.ITextStyle> }) {
		super(asset);
		this.view = new PIXI.Text(asset.text, textStyle);
		this.view.resolution = 5;
		this.view.zIndex = 1;
		this.view.anchor.set(0.5, 0.5);
	}
	get resolution(): number {
		return this.view.resolution;
	}
	set resolution(value: number) {
		this.view.resolution = value;
	}
}

class ManagedTextureSprite extends ManagedSprite<TextureAsset> {
	view: PIXI.Sprite | PIXI.TilingSprite;

	constructor({ asset, tiling = false }: { asset: TextureAsset; tiling?: boolean }) {
		super(asset);
		const SpriteConstructor = tiling ? PIXI.TilingSprite : PIXI.Sprite;
		this.view = new SpriteConstructor(asset.texture);
	}
}

class ManagedAnimatedSprite<T extends VideoAsset | VideoSpritesheetAsset | FlipbookAsset> extends ManagedSprite<T> {
	view: PIXI.AnimatedSprite | AnimatedTilingSprite | PIXI.Sprite;
	controls: PlaybackControls;

	// make sure we always return the same texture...
	override get texture(): PIXI.Texture {
		if (this.asset instanceof VideoSpritesheetAsset || this.asset instanceof FlipbookAsset) {
			return this.asset.frameObjects[0]?.texture ?? PIXI.Texture.EMPTY
		}
		return super.texture
	}

	constructor({ asset, tiling = false }: { asset: T; tiling?: boolean }) {
		super(asset);
		if (asset instanceof VideoAsset) {
			const SpriteConstructor = tiling ? PIXI.TilingSprite : PIXI.Sprite;
			this.view = new SpriteConstructor(asset.texture);
			this.controls = new VideoPlaybackControls(asset.video, asset.texture);
		} else {
			const SpriteConstructor = tiling ? PIXI.AnimatedSprite : PIXI.AnimatedSprite;
			const view = new SpriteConstructor(asset.frameObjects, true);
			this.view = view;
			this.controls = new SpritePlaybackControls(view, asset.framerate);
		}
	}

	override destroy(): void {
		this.stop();
		super.destroy();
	}

	override activate(): void {
		super.activate();
		this.controls.play();
	}

	override deactivate(): void {
		super.deactivate();
		this.stop();
	}

	async play(): Promise<void> {
		this.controls.play();
	}
	stop(): void {
		this.controls.stop();
	}

	get loop(): boolean {
		return this.controls.loop;
	}
	set loop(value: boolean) {
		this.controls.loop = value;
	}

	get volume(): number {
		return this.controls.volume;
	}
	set volume(value: number) {
		this.controls.volume = value;
	}

	get isPlaying(): boolean {
		return this.controls.isPlaying;
	}

	get currentTime(): number {
		return this.controls.currentTime;
	}
	set currentTime(value: number) {
		this.controls.currentTime = value;
	}

	get playbackRate(): number {
		return this.controls.playbackRate;
	}
	set playbackRate(value: number) {
		this.controls.playbackRate = value;
	}
}
//#endregion

//#region Playback controls
abstract class PlaybackControls {
	abstract play(): Promise<void>;
	abstract stop(): void;
	abstract loop: boolean;
	abstract readonly isPlaying: boolean;
	abstract volume: number;
	abstract currentTime: number;
	abstract playbackRate: number;
}

class VideoPlaybackControls extends PlaybackControls {
	#video: HTMLVideoElement;
	#texture: PIXI.Texture;

	constructor(video: HTMLVideoElement, texture: PIXI.Texture) {
		super();
		this.#video = video;
		this.#texture = texture;
	}

	async play(): Promise<void> {
		try {
			await this.#video.play();
			this.#texture.update();
		} catch (error) {
			console.log("error playing video", error);
		}
	}
	stop(): void {
		this.#video.pause();
	}

	get isPlaying(): boolean {
		return !this.#video.paused;
	}

	get loop(): boolean {
		return this.#video.loop;
	}
	set loop(value: boolean) {
		this.#video.loop = value;
	}

	get volume(): number {
		return this.#video.volume;
	}
	set volume(value: number) {
		this.#video.volume = value;
	}

	get currentTime(): number {
		return this.#video.currentTime;
	}
	set currentTime(value: number) {
		this.#video.currentTime = value;
	}

	get playbackRate(): number {
		return this.#video.playbackRate;
	}
	set playbackRate(value: number) {
		this.#video.playbackRate = value;
	}
}

class SpritePlaybackControls extends PlaybackControls {
	#sprite: AnimatedTilingSprite | PIXI.AnimatedSprite;
	#framerate: number;

	constructor(sprite: AnimatedTilingSprite | PIXI.AnimatedSprite, framerate: number) {
		super();
		this.#sprite = sprite;
		this.#framerate = framerate;
	}

	async play(): Promise<void> {
		this.#sprite.play();
	}
	stop(): void {
		this.#sprite.stop();
	}

	get isPlaying(): boolean {
		return this.#sprite.playing;
	}

	get loop(): boolean {
		return this.#sprite.loop;
	}
	set loop(value: boolean) {
		this.#sprite.loop = value;
	}

	get volume(): number {
		return 0;
	}
	set volume(value: number) {
		// cannot set volume
	}

	get currentTime(): number {
		return this.#sprite.currentFrame / this.#framerate;
	}
	set currentTime(value: number) {
		const currentFrame = value * this.#framerate;
		this.#sprite.currentFrame = currentFrame;
	}

	get playbackRate(): number {
		return this.#sprite.animationSpeed;
	}
	set playbackRate(value: number) {
		this.#sprite.animationSpeed = value;
	}
}
//#endregion Playback controls

//#region SpriteManager
export const enum SpecialSpriteKeys {
	Text = "TEXT",
}

interface SpriteData {
	tilingScale: PIXI.ObservablePoint;
	tilingPosition: PIXI.ObservablePoint;
	anchor: PIXI.ObservablePoint;
	scale: PIXI.ObservablePoint;
	resolution: number;
	width: number;
	height: number;
	playing: boolean;
	volume: number;
	loop: boolean;
	currentTime: number;
	playbackRate: number;
}

interface SequencerTemplate {
	startPoint: number;
	endPoint: number;
	gridSize: number;
}

interface SpriteMetadata {
	antialiasing?: boolean;
	tiling?: boolean;
	template?: number;
	textStyle?: Partial<PIXI.ITextStyle>;
}
interface InitialSpriteData {
	data: SpriteMetadata;
	shader?: PIXI.Shader
}
interface InitialSpriteFileData extends InitialSpriteData {
	file: SequencerFileBase;
	tiling?: Boolean;
}
interface InitialSpriteTextData extends InitialSpriteData {
	text: string;
}

export class SequencerSpriteManager extends PIXI.Container {
	#text?: string;
	#file?: SequencerFileBase;
	#metadata: SpriteMetadata;
	#activePath!: string;
	#managedSprites: Record<string, ManagedSprite> = {};

	// this will only be set after initialization promise is done!
	#spriteData!: SpriteData;
	#initializedPromise: Promise<void>;

	#preloadingPromise?: Promise<void>;
	get preloadingPromise(): Promise<void> {
		if (this.#preloadingPromise) {
			return this.#preloadingPromise;
		}
		return Promise.resolve();
	}

	static async make(options: InitialSpriteFileData | InitialSpriteTextData) {
		const instance = new SequencerSpriteManager(options);
		await instance.#initializedPromise;
		return instance;
	}

	constructor(options: InitialSpriteFileData | InitialSpriteTextData) {
		super();
		this.#metadata = options.data;
		if ("text" in options) {
			this.#text = options.text;
			this.activate(SpecialSpriteKeys.Text);
			this.#initializedPromise = Promise.resolve();
			return;
		}
		this.#file = options.file;
		if (this.#file.isFlipbook) {
		}
		this.#initializedPromise = this.activate(this.#file.getFile()).then(() => {});
	}

	//#region Managed Sprite proxies
	play() {
		if (!(this.#activeSprite instanceof ManagedAnimatedSprite)) {
			return;
		}
		this.#activeSprite.play();
		this.#spriteData.playing = true;
	}

	stop() {
		if (!(this.#activeSprite instanceof ManagedAnimatedSprite)) {
			return;
		}
		this.#activeSprite.stop();
		this.#spriteData.playing = false;
	}

	get tilingScale(): PIXI.ObservablePoint {
		return this.#spriteData.tilingScale;
	}
	set tilingScale(point: PIXI.IPointData) {
		this.#spriteData.tilingScale.copyFrom(point);
	}

	get tilingPosition(): PIXI.ObservablePoint {
		return this.#spriteData.tilingPosition;
	}
	set tilingPosition(point: PIXI.IPointData) {
		this.#spriteData.tilingPosition.copyFrom(point);
	}

	get anchor(): PIXI.ObservablePoint {
		return this.#spriteData.anchor;
	}
	set anchor(point: PIXI.IPointData) {
		this.#spriteData.anchor.copyFrom(point);
	}

	override get scale(): PIXI.ObservablePoint {
		return this.#spriteData.scale;
	}
	override set scale(point: PIXI.IPointData) {
		this.#spriteData.scale.copyFrom(point);
	}

	override get width(): number {
		return this.#spriteData.width;
	}
	override set width(value: number) {
		this.#spriteData.width = value;
		this.#setAllSprites("width", value);
	}

	override get height(): number {
		return this.#spriteData.height;
	}
	override set height(value: number) {
		this.#spriteData.width = value;
		this.#setAllSprites("height", value);
	}

	get resolution(): number {
		return this.#spriteData.resolution;
	}
	set resolution(value: number) {
		this.#spriteData.resolution = value;
		Object.values(this.#managedSprites).forEach((sprite) => {
			if (sprite instanceof ManagedTextSprite) {
				sprite.resolution = value;
			}
		});
	}

	get playing(): boolean {
		return this.#spriteData.playing;
	}

	get volume(): number {
		return this.#spriteData.volume;
	}
	set volume(value: number) {
		this.#spriteData.volume = value;
		Object.values(this.#managedSprites).forEach((sprite) => {
			if (sprite instanceof ManagedAnimatedSprite) {
				sprite.volume = value;
			}
		});
	}

	get loop(): boolean {
		return this.#spriteData.loop;
	}
	set loop(value: boolean) {
		this.#spriteData.loop = value;
		Object.values(this.#managedSprites).forEach((sprite) => {
			if (sprite instanceof ManagedAnimatedSprite) {
				sprite.loop = value;
			}
		});
	}

	get currentTime(): unknown {
		return this.#spriteData.currentTime;
	}
	set currentTime(value: number) {
		this.#spriteData.currentTime = value;
		Object.values(this.#managedSprites).forEach((sprite) => {
			if (sprite instanceof ManagedAnimatedSprite) {
				sprite.currentTime = value;
			}
		});
	}

	get playbackRate(): unknown {
		return this.#spriteData.playbackRate;
	}
	set playbackRate(value: number) {
		this.#spriteData.playbackRate = value;
		Object.values(this.#managedSprites).forEach((sprite) => {
			if (sprite instanceof ManagedAnimatedSprite) {
				sprite.playbackRate = value;
			}
		});
	}
	//#endregion

	//#region public api
	async activate(filePath: string): Promise<PIXI.Texture | undefined> {
		if (this.#activePath === filePath) {
			this.#managedSprites[filePath].texture
		}

		let nextSprite = this.#managedSprites[filePath];
		if (nextSprite) {
			// deactivate currently playing animation
			const lastSprite = this.#managedSprites[this.#activePath];
			lastSprite.deactivate();
			// sync playback time for more seamless transition
			if (lastSprite instanceof ManagedAnimatedSprite && nextSprite instanceof ManagedAnimatedSprite) {
				nextSprite.currentTime = lastSprite.currentTime;
			}
			// activate new animation
			nextSprite.activate();
			return nextSprite.texture;
		}

		if (filePath === SpecialSpriteKeys.Text) {
			const textAsset = new TextAsset({ text: this.#text ?? "" });
			const newSprite = new ManagedTextSprite({ asset: textAsset });
			this.#applyCommonSpriteValues(newSprite);
			this.addChild(newSprite.view);
			this.#managedSprites[filePath] = newSprite;
			return newSprite.texture;
		}
		const asset = await this.#loadAsset(filePath);
		const newSprite = this.#buildSprite(asset);
		this.#applyCommonSpriteValues(newSprite);
		return newSprite.texture
	}

	async preloadVariants(): Promise<void> {
		if (!this.#preloadingPromise) {
			return (this.#preloadingPromise = this.#preloadVariants());
		}
		return this.#preloadingPromise;
	}

	override destroy(): void {
		super.destroy({ children: true });
		Object.values(this.#managedSprites).forEach((sprite) => sprite.destroy());
	}
	//#endregion

	//#region private
	get #activeSprite(): ManagedSprite {
		return this.#managedSprites[this.#activePath];
	}

	async #preloadVariants(): Promise<void> {
		if (this.#activePath === SpecialSpriteKeys.Text) {
			return;
		}
		if (!this.#file || this.#file.isFlipbook) {
			return;
		}
		const allFiles = this.#file.getAllFiles();
		const sprites = await Promise.all(
			allFiles.map(async (filePath) => {
				if (this.#managedSprites[filePath]) {
					return this.#managedSprites[filePath];
				}
				const asset = await this.#loadAsset(filePath);
				const newSprite = this.#buildSprite(asset);
				this.#applyCommonSpriteValues(newSprite);
				return newSprite;
			})
		);
		sprites.forEach((sprite) => this.addChild(sprite.view));
	}

	async #loadAsset(filepath: string): Promise<Asset> {
		if (this.#file && this.#file.isFlipbook) {
			return this.#loadFlipbook(this.#file.getAllFiles());
		}
		const texture = await SequencerFileCache.loadFile(filepath);

		const mipmapDisablingFormats = ["BASISU_ETC1S"];
		// disable mipmaps if using compressed textures
		if (mipmapDisablingFormats.includes(texture?.data?.meta?.format)) {
			texture?.baseTexture?.setStyle(0, 0);
		} else if (this.#metadata.antialiasing != null) {
			texture?.baseTexture.setStyle(0, this.#metadata.antialiasing);
		}

		if (texture instanceof PIXI.Spritesheet) {
			return new VideoSpritesheetAsset({ filepath, spritesheet: texture });
		}
		if (texture.baseTexture?.resource?.source instanceof HTMLVideoElement) {
			return new VideoAsset({ filepath, texture, video: texture.baseTexture.resource.source });
		}
		return new TextureAsset({ filepath, texture });
	}

	async #loadFlipbook(filepaths: string[]): Promise<FlipbookAsset> {
		const textures = await Promise.all(
			filepaths.map(async (filepath) => loadTexture(filepath) as Promise<PIXI.Texture>)
		);
		return new FlipbookAsset({ filepaths, textures, framerate: 24 });
	}

	#buildSprite(asset: Asset): ManagedSprite {
		if (asset instanceof TextAsset) {
			return new ManagedTextSprite({ asset, textStyle: this.#metadata.textStyle });
		}
		if (asset instanceof TextureAsset) {
			return new ManagedTextureSprite({ asset, tiling: this.#metadata.tiling });
		}
		if (asset instanceof VideoAsset || asset instanceof VideoSpritesheetAsset || asset instanceof FlipbookAsset) {
			return new ManagedAnimatedSprite({ asset: asset, tiling: this.#metadata.tiling });
		}
		throw "unrecognized asset";
	}
	#applyCommonSpriteValues(sprite: ManagedSprite) {
		if (!this.#spriteData) {
			this.#createSpriteData(sprite);
		}
		// TODO apply data
	}

	#createSpriteData(sprite: ManagedSprite) {
		this.#spriteData = {
			tilingScale: this.#createProxyPoint("tileScale"),
			tilingPosition: this.#createProxyPoint("tilePosition"),
			anchor: this.#createProxyPoint("anchor"),
			scale: this.#createProxyPoint("scale"),
			width: sprite.view.width,
			height: sprite.view.width,
			resolution: 5,
			volume: 0,
			playing: false,
			loop: false,
			currentTime: 0,
			playbackRate: 1,
		};
	}

	#createProxyPoint(key: string): PIXI.ObservablePoint {
		return new PIXI.ObservablePoint(() => {
			Object.values(this.#managedSprites).forEach((sprite) => {
				const point = (sprite.view as any)[key];
				if (point instanceof PIXI.ObservablePoint) {
					point.copyFrom(this.#spriteData.anchor);
				}
			});
		}, this);
	}

	#setAllSprites<Key extends keyof PIXI.Sprite>(key: Key, value: PIXI.Sprite[Key]): void {
		Object.values(this.#managedSprites).forEach((sprite) => (sprite.view[key] = value));
	}
	//#endregion
}
//#endregion
